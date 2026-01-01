import { Injectable, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Stripe from 'stripe'
import { PrismaService } from '../prisma/prisma.service'
import { Plan, SubscriptionStatus } from '@prisma/client'

const PLAN_PRICE_IDS: Record<string, string> = {
  basic: 'price_basic_monthly', // Replace with actual Stripe price IDs
  pro: 'price_pro_monthly',
}

@Injectable()
export class BillingService {
  private stripe: Stripe

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') || 'sk_test_placeholder',
      {
        apiVersion: '2023-10-16',
      },
    )
  }

  async createCheckoutSession(userId: string, plan: 'basic' | 'pro') {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    })

    if (!user) {
      throw new BadRequestException('User not found')
    }

    // Get or create Stripe customer
    let customerId = user.subscription?.stripeCustomerId

    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: { userId },
      })
      customerId = customer.id

      // Create subscription record if it doesn't exist
      await this.prisma.subscription.upsert({
        where: { userId },
        update: { stripeCustomerId: customerId },
        create: {
          userId,
          stripeCustomerId: customerId,
          plan: Plan.FREE,
          status: SubscriptionStatus.ACTIVE,
        },
      })
    }

    const priceId = PLAN_PRICE_IDS[plan]
    const successUrl = this.configService.get<string>('FRONTEND_URL') + '/dashboard/billing?success=true'
    const cancelUrl = this.configService.get<string>('FRONTEND_URL') + '/dashboard/billing?canceled=true'

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        plan,
      },
    })

    return { sessionId: session.id, url: session.url }
  }

  async createPortalSession(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    })

    if (!user?.subscription?.stripeCustomerId) {
      throw new BadRequestException('No billing account found')
    }

    const returnUrl = this.configService.get<string>('FRONTEND_URL') + '/dashboard/billing'

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: returnUrl,
    })

    return { url: session.url }
  }

  async getSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    })

    if (!subscription) {
      return {
        plan: 'FREE',
        status: 'ACTIVE',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      }
    }

    return {
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    }
  }

  async handleWebhook(rawBody: string, signature: string) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET')

    let event: Stripe.Event

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret || '')
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed`)
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return { received: true }
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string

    // Find user by Stripe customer ID
    const existingSubscription = await this.prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    })

    if (!existingSubscription) {
      console.warn(`No subscription found for customer ${customerId}`)
      return
    }

    // Determine plan from price ID
    const priceId = subscription.items.data[0]?.price.id
    let plan = Plan.FREE
    if (priceId === PLAN_PRICE_IDS.basic) plan = Plan.BASIC
    else if (priceId === PLAN_PRICE_IDS.pro) plan = Plan.PRO

    // Map Stripe status to our status
    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      canceled: SubscriptionStatus.CANCELED,
      incomplete: SubscriptionStatus.INCOMPLETE,
      incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
      past_due: SubscriptionStatus.PAST_DUE,
      paused: SubscriptionStatus.PAUSED,
      trialing: SubscriptionStatus.TRIALING,
      unpaid: SubscriptionStatus.UNPAID,
    }

    await this.prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        stripeSubscriptionId: subscription.id,
        plan,
        status: statusMap[subscription.status] || SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    })

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: existingSubscription.userId,
        action: 'plan_changed',
        metadata: {
          newPlan: plan,
          stripeSubscriptionId: subscription.id,
        },
      },
    })
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string

    const existingSubscription = await this.prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    })

    if (!existingSubscription) return

    await this.prisma.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        plan: Plan.FREE,
        status: SubscriptionStatus.CANCELED,
        stripeSubscriptionId: null,
      },
    })

    await this.prisma.auditLog.create({
      data: {
        userId: existingSubscription.userId,
        action: 'plan_changed',
        metadata: {
          newPlan: 'FREE',
          reason: 'subscription_deleted',
        },
      },
    })
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    // Log successful payment
    console.log(`Payment succeeded for invoice ${invoice.id}`)
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    // Could send email notification or update subscription status
    console.log(`Payment failed for invoice ${invoice.id}`)
  }
}
