import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger'

import { BillingService } from './billing.service'
import { CreateCheckoutSessionDto } from './dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { Request as ExpressRequest } from 'express'

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current subscription' })
  @ApiResponse({ status: 200, description: 'Subscription details' })
  async getSubscription(@Request() req: { user: { sub: string } }) {
    return this.billingService.getSubscription(req.user.sub)
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a checkout session' })
  @ApiResponse({ status: 200, description: 'Checkout session URL' })
  async createCheckoutSession(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.billingService.createCheckoutSession(req.user.sub, dto.plan)
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a customer portal session' })
  @ApiResponse({ status: 200, description: 'Portal session URL' })
  async createPortalSession(@Request() req: { user: { sub: string } }) {
    return this.billingService.createPortalSession(req.user.sub)
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(
    @Req() req: RawBodyRequest<ExpressRequest>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody?.toString() || ''
    return this.billingService.handleWebhook(rawBody, signature)
  }
}
