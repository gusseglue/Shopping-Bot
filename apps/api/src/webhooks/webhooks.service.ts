import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { CreateWebhookDto, UpdateWebhookDto } from './dto'
import { WebhookType, Alert } from '@prisma/client'

interface AlertData {
  productName: string
  productUrl: string
  previousValue?: string | number
  currentValue?: string | number
  message?: string
}

@Injectable()
export class WebhooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async findAll(userId: string) {
    const webhooks = await this.prisma.webhookConfig.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    // Mask URLs for security
    return webhooks.map((w) => ({
      ...w,
      url: this.maskUrl(w.url),
    }))
  }

  async findById(userId: string, id: string) {
    const webhook = await this.prisma.webhookConfig.findFirst({
      where: { id, userId },
    })

    if (!webhook) {
      throw new NotFoundException('Webhook not found')
    }

    return {
      ...webhook,
      url: this.maskUrl(webhook.url),
    }
  }

  async create(userId: string, dto: CreateWebhookDto) {
    // Validate webhook URL based on type
    this.validateWebhookUrl(dto.type, dto.url)

    // Check if user already has this webhook type
    const existing = await this.prisma.webhookConfig.findUnique({
      where: {
        userId_type: {
          userId,
          type: dto.type.toUpperCase() as WebhookType,
        },
      },
    })

    if (existing) {
      throw new BadRequestException(
        `You already have a ${dto.type} webhook configured. Please update or delete it first.`,
      )
    }

    const webhook = await this.prisma.webhookConfig.create({
      data: {
        userId,
        type: dto.type.toUpperCase() as WebhookType,
        url: dto.url, // In production, encrypt this
      },
    })

    return {
      ...webhook,
      url: this.maskUrl(webhook.url),
    }
  }

  async update(userId: string, id: string, dto: UpdateWebhookDto) {
    const existing = await this.prisma.webhookConfig.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      throw new NotFoundException('Webhook not found')
    }

    if (dto.url) {
      this.validateWebhookUrl(existing.type.toLowerCase() as 'discord' | 'slack' | 'custom', dto.url)
    }

    const webhook = await this.prisma.webhookConfig.update({
      where: { id },
      data: {
        ...(dto.url && { url: dto.url }),
        ...(typeof dto.enabled === 'boolean' && { enabled: dto.enabled }),
      },
    })

    return {
      ...webhook,
      url: this.maskUrl(webhook.url),
    }
  }

  async delete(userId: string, id: string) {
    const existing = await this.prisma.webhookConfig.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      throw new NotFoundException('Webhook not found')
    }

    await this.prisma.webhookConfig.delete({ where: { id } })

    return { success: true }
  }

  async test(userId: string, id: string, message?: string) {
    const webhook = await this.prisma.webhookConfig.findFirst({
      where: { id, userId },
    })

    if (!webhook) {
      throw new NotFoundException('Webhook not found')
    }

    try {
      await this.sendWebhookRequest(webhook.type, webhook.url, {
        content:
          message ||
          '🧪 Test message from Shopping Assistant! Your webhook is working correctly.',
        embeds: [
          {
            title: 'Webhook Test',
            description: 'This is a test notification from Shopping Assistant.',
            color: 0x00ff00,
            timestamp: new Date().toISOString(),
          },
        ],
      })

      // Update last tested timestamp
      await this.prisma.webhookConfig.update({
        where: { id },
        data: { lastTestedAt: new Date() },
      })

      return { success: true, message: 'Test webhook sent successfully' }
    } catch (error) {
      throw new BadRequestException(
        `Failed to send test webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  // Internal method to send alert to webhook
  async sendAlert(webhookId: string, alert: Alert, data: AlertData) {
    const webhook = await this.prisma.webhookConfig.findUnique({
      where: { id: webhookId },
    })

    if (!webhook || !webhook.enabled) {
      return
    }

    const embed = this.formatAlertEmbed(alert, data)
    await this.sendWebhookRequest(webhook.type, webhook.url, { embeds: [embed] })
  }

  private validateWebhookUrl(type: 'discord' | 'slack' | 'custom', url: string) {
    try {
      const parsed = new URL(url)

      switch (type) {
        case 'discord':
          if (!parsed.hostname.endsWith('discord.com')) {
            throw new BadRequestException('Discord webhooks must use discord.com URLs')
          }
          break
        case 'slack':
          if (!parsed.hostname.endsWith('slack.com')) {
            throw new BadRequestException('Slack webhooks must use slack.com URLs')
          }
          break
        case 'custom':
          // Allow any HTTPS URL for custom webhooks
          if (parsed.protocol !== 'https:') {
            throw new BadRequestException('Custom webhooks must use HTTPS')
          }
          break
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      throw new BadRequestException('Invalid webhook URL')
    }
  }

  private async sendWebhookRequest(type: WebhookType, url: string, payload: object) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Webhook request failed with status ${response.status}`)
    }
  }

  private formatAlertEmbed(alert: Alert, data: AlertData) {
    const alertTypeColors: Record<string, number> = {
      PRICE_CHANGE: 0x00ff00, // Green
      BACK_IN_STOCK: 0x0099ff, // Blue
      SIZE_AVAILABLE: 0xff9900, // Orange
      ERROR: 0xff0000, // Red
    }

    const alertTypeEmojis: Record<string, string> = {
      PRICE_CHANGE: '💰',
      BACK_IN_STOCK: '📦',
      SIZE_AVAILABLE: '👕',
      ERROR: '⚠️',
    }

    return {
      title: `${alertTypeEmojis[alert.type] || '🔔'} ${data.productName}`,
      description: data.message || this.getDefaultMessage(alert.type, data),
      url: data.productUrl,
      color: alertTypeColors[alert.type] || 0x888888,
      fields: this.getAlertFields(alert.type, data),
      timestamp: alert.createdAt.toISOString(),
      footer: {
        text: 'Shopping Assistant',
      },
    }
  }

  private getDefaultMessage(type: string, data: AlertData): string {
    switch (type) {
      case 'PRICE_CHANGE':
        return `Price changed from ${data.previousValue} to ${data.currentValue}`
      case 'BACK_IN_STOCK':
        return 'Product is back in stock!'
      case 'SIZE_AVAILABLE':
        return `Size ${data.currentValue} is now available`
      case 'ERROR':
        return 'An error occurred while checking this product'
      default:
        return 'Alert triggered'
    }
  }

  private getAlertFields(type: string, data: AlertData) {
    const fields = []

    if (data.previousValue !== undefined && data.currentValue !== undefined) {
      fields.push(
        { name: 'Previous', value: String(data.previousValue), inline: true },
        { name: 'Current', value: String(data.currentValue), inline: true },
      )
    }

    return fields
  }

  private maskUrl(url: string): string {
    try {
      const parsed = new URL(url)
      const pathParts = parsed.pathname.split('/')
      if (pathParts.length > 2) {
        // Mask webhook ID/token
        return `${parsed.origin}/.../${pathParts.slice(-1)[0].slice(0, 4)}...`
      }
      return `${parsed.origin}/...`
    } catch {
      return '***'
    }
  }
}
