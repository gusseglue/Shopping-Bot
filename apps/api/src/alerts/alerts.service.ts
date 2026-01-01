import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AlertQueryDto, CreateAlertDto } from './dto'
import { WebhooksService } from '../webhooks/webhooks.service'
import { AlertType } from '@prisma/client'

@Injectable()
export class AlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooksService: WebhooksService,
  ) {}

  async findAll(userId: string, query: AlertQueryDto) {
    const { page = 1, limit = 20, type, watcherId, unreadOnly } = query
    const skip = (page - 1) * limit

    const where = {
      userId,
      ...(type && { type: type.toUpperCase() as AlertType }),
      ...(watcherId && { watcherId }),
      ...(unreadOnly && { readAt: null }),
    }

    const [alerts, total] = await Promise.all([
      this.prisma.alert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          watcher: {
            select: {
              id: true,
              name: true,
              url: true,
            },
          },
        },
      }),
      this.prisma.alert.count({ where }),
    ])

    return {
      items: alerts,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async findById(userId: string, id: string) {
    const alert = await this.prisma.alert.findFirst({
      where: { id, userId },
      include: {
        watcher: true,
      },
    })

    if (!alert) {
      throw new NotFoundException('Alert not found')
    }

    return alert
  }

  async markAsRead(userId: string, id: string) {
    const alert = await this.prisma.alert.findFirst({
      where: { id, userId },
    })

    if (!alert) {
      throw new NotFoundException('Alert not found')
    }

    return this.prisma.alert.update({
      where: { id },
      data: { readAt: new Date() },
    })
  }

  async markAllAsRead(userId: string) {
    await this.prisma.alert.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    })

    return { success: true }
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.alert.count({
      where: { userId, readAt: null },
    })

    return { count }
  }

  // Internal method for worker to create alerts
  async create(dto: CreateAlertDto) {
    // Get watcher to find userId
    const watcher = await this.prisma.watcher.findUnique({
      where: { id: dto.watcherId },
      include: {
        user: {
          include: {
            webhookConfigs: {
              where: { enabled: true },
            },
          },
        },
      },
    })

    if (!watcher) {
      throw new NotFoundException('Watcher not found')
    }

    // Create alert
    const alert = await this.prisma.alert.create({
      data: {
        watcherId: dto.watcherId,
        userId: watcher.userId,
        type: dto.type.toUpperCase() as AlertType,
        data: dto.data as object,
      },
    })

    // Update watcher lastAlertAt
    await this.prisma.watcher.update({
      where: { id: dto.watcherId },
      data: { lastAlertAt: new Date() },
    })

    // Send to webhooks
    for (const webhook of watcher.user.webhookConfigs) {
      try {
        await this.webhooksService.sendAlert(webhook.id, alert, dto.data)
      } catch (error) {
        console.error(`Failed to send webhook ${webhook.id}:`, error)
      }
    }

    return alert
  }

  async delete(userId: string, id: string) {
    const alert = await this.prisma.alert.findFirst({
      where: { id, userId },
    })

    if (!alert) {
      throw new NotFoundException('Alert not found')
    }

    await this.prisma.alert.delete({ where: { id } })

    return { success: true }
  }
}
