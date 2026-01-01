import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { BadRequestException } from '@nestjs/common'
import Stripe from 'stripe'

import { BillingService } from './billing.service'
import { PrismaService } from '../prisma/prisma.service'
import { Plan, SubscriptionStatus } from '@prisma/client'

// Mock Stripe
jest.mock('stripe')

describe('BillingService', () => {
  let service: BillingService
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prismaService: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockStripe: any

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    subscription: {
      id: 'sub-123',
      userId: 'user-123',
      plan: Plan.BASIC,
      status: SubscriptionStatus.ACTIVE,
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_stripe_123',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
      subscription: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    }

    const mockConfig = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          STRIPE_SECRET_KEY: 'sk_test_placeholder',
          STRIPE_WEBHOOK_SECRET: 'whsec_test_placeholder',
          FRONTEND_URL: 'http://localhost:3000',
        }
        return config[key]
      }),
    }

    // Create mock Stripe instance
    mockStripe = {
      customers: {
        create: jest.fn(),
      },
      checkout: {
        sessions: {
          create: jest.fn(),
        },
      },
      billingPortal: {
        sessions: {
          create: jest.fn(),
        },
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
    } as unknown as jest.Mocked<Stripe>

    ;(Stripe as jest.MockedClass<typeof Stripe>).mockImplementation(
      () => mockStripe
    )

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile()

    service = module.get<BillingService>(BillingService)
    prismaService = module.get(PrismaService)
  })

  describe('createCheckoutSession', () => {
    it('should create checkout session for existing customer', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce(mockUser)
      mockStripe.checkout.sessions.create.mockResolvedValueOnce({
        id: 'cs_123',
        url: 'https://checkout.stripe.com/session/123',
      } as Stripe.Checkout.Session)

      const result = await service.createCheckoutSession('user-123', 'basic')

      expect(result.sessionId).toBe('cs_123')
      expect(result.url).toBe('https://checkout.stripe.com/session/123')
    })

    it('should create customer if not exists', async () => {
      const userWithoutCustomer = {
        ...mockUser,
        subscription: null,
      }
      prismaService.user.findUnique.mockResolvedValueOnce(userWithoutCustomer)
      mockStripe.customers.create.mockResolvedValueOnce({
        id: 'cus_new_123',
      } as Stripe.Customer)
      prismaService.subscription.upsert.mockResolvedValueOnce({} as any)
      mockStripe.checkout.sessions.create.mockResolvedValueOnce({
        id: 'cs_123',
        url: 'https://checkout.stripe.com/session/123',
      } as Stripe.Checkout.Session)

      const result = await service.createCheckoutSession('user-123', 'pro')

      expect(mockStripe.customers.create).toHaveBeenCalled()
      expect(result.sessionId).toBe('cs_123')
    })

    it('should throw BadRequestException for non-existent user', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce(null)

      await expect(
        service.createCheckoutSession('nonexistent-user', 'basic')
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('createPortalSession', () => {
    it('should create portal session for user with subscription', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce(mockUser)
      mockStripe.billingPortal.sessions.create.mockResolvedValueOnce({
        url: 'https://billing.stripe.com/session/123',
      } as Stripe.BillingPortal.Session)

      const result = await service.createPortalSession('user-123')

      expect(result.url).toBe('https://billing.stripe.com/session/123')
    })

    it('should throw BadRequestException if no billing account', async () => {
      const userWithoutSubscription = {
        ...mockUser,
        subscription: null,
      }
      prismaService.user.findUnique.mockResolvedValueOnce(
        userWithoutSubscription
      )

      await expect(service.createPortalSession('user-123')).rejects.toThrow(
        BadRequestException
      )
    })
  })

  describe('getSubscription', () => {
    it('should return subscription details', async () => {
      prismaService.subscription.findUnique.mockResolvedValueOnce(
        mockUser.subscription
      )

      const result = await service.getSubscription('user-123')

      expect(result.plan).toBe(Plan.BASIC)
      expect(result.status).toBe(SubscriptionStatus.ACTIVE)
    })

    it('should return FREE plan if no subscription', async () => {
      prismaService.subscription.findUnique.mockResolvedValueOnce(null)

      const result = await service.getSubscription('user-123')

      expect(result.plan).toBe('FREE')
      expect(result.status).toBe('ACTIVE')
    })
  })

  describe('handleWebhook', () => {
    it('should handle subscription.created event', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            status: 'active',
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + 2592000,
            cancel_at_period_end: false,
            items: {
              data: [
                {
                  price: { id: 'price_basic_monthly' },
                },
              ],
            },
          } as Stripe.Subscription,
        },
        object: 'event',
        api_version: '2023-10-16',
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 0,
        request: null,
      }

      mockStripe.webhooks.constructEvent.mockReturnValueOnce(mockEvent)
      prismaService.subscription.findFirst.mockResolvedValueOnce(
        mockUser.subscription
      )
      prismaService.subscription.update.mockResolvedValueOnce({
        ...mockUser.subscription,
        plan: Plan.BASIC,
      })
      prismaService.auditLog.create.mockResolvedValueOnce({} as any)

      const result = await service.handleWebhook(
        JSON.stringify(mockEvent),
        'sig_test'
      )

      expect(result.received).toBe(true)
      expect(prismaService.subscription.update).toHaveBeenCalled()
    })

    it('should handle subscription.deleted event', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_123',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
          } as Stripe.Subscription,
        },
        object: 'event',
        api_version: '2023-10-16',
        created: Math.floor(Date.now() / 1000),
        livemode: false,
        pending_webhooks: 0,
        request: null,
      }

      mockStripe.webhooks.constructEvent.mockReturnValueOnce(mockEvent)
      prismaService.subscription.findFirst.mockResolvedValueOnce(
        mockUser.subscription
      )
      prismaService.subscription.update.mockResolvedValueOnce({
        ...mockUser.subscription,
        plan: Plan.FREE,
        status: SubscriptionStatus.CANCELED,
      })
      prismaService.auditLog.create.mockResolvedValueOnce({} as any)

      const result = await service.handleWebhook(
        JSON.stringify(mockEvent),
        'sig_test'
      )

      expect(result.received).toBe(true)
      expect(prismaService.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            plan: Plan.FREE,
            status: SubscriptionStatus.CANCELED,
          }),
        })
      )
    })

    it('should throw BadRequestException for invalid signature', async () => {
      mockStripe.webhooks.constructEvent.mockImplementationOnce(() => {
        throw new Error('Invalid signature')
      })

      await expect(
        service.handleWebhook('invalid-body', 'invalid-sig')
      ).rejects.toThrow(BadRequestException)
    })
  })
})
