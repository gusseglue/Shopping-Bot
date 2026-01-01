import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateWatcherDto, UpdateWatcherDto, WatcherQueryDto } from './dto'
import { Plan, WatcherStatus } from '@prisma/client'

// Domain validation
const ALLOWED_DOMAINS = [
  'example.com',
  'amazon.com',
  'amazon.co.uk',
  'ebay.com',
  'walmart.com',
  'target.com',
  'bestbuy.com',
  'newegg.com',
  'zalando.dk',
  'zalando.se',
  'nike.com',
  'adidas.com',
  'footlocker.com',
]

const PLAN_LIMITS: Record<Plan, { maxWatchers: number; minInterval: number }> = {
  FREE: { maxWatchers: 3, minInterval: 600 },
  BASIC: { maxWatchers: 10, minInterval: 300 },
  PRO: { maxWatchers: 100, minInterval: 60 },
}

@Injectable()
export class WatchersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateWatcherDto) {
    // Get user's plan
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true, _count: { select: { watchers: true } } },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    const plan = user.subscription?.plan || Plan.FREE
    const limits = PLAN_LIMITS[plan]

    // Check watcher limit
    if (user._count.watchers >= limits.maxWatchers) {
      throw new ForbiddenException(
        `You have reached the maximum number of watchers (${limits.maxWatchers}) for your plan`,
      )
    }

    // Check interval limit
    if (dto.interval < limits.minInterval) {
      throw new BadRequestException(
        `Minimum check interval for your plan is ${limits.minInterval} seconds`,
      )
    }

    // Extract and validate domain
    const domain = this.extractDomain(dto.url)
    if (!this.isDomainAllowed(domain)) {
      throw new BadRequestException(
        `Domain "${domain}" is not allowed. Please use a supported domain.`,
      )
    }

    // Create watcher
    const watcher = await this.prisma.watcher.create({
      data: {
        userId,
        url: dto.url,
        name: dto.name,
        domain,
        rules: dto.rules as object,
        interval: dto.interval,
      },
    })

    return watcher
  }

  async findAll(userId: string, query: WatcherQueryDto) {
    const { page = 1, limit = 20, status } = query
    const skip = (page - 1) * limit

    const where = {
      userId,
      ...(status && { status: status.toUpperCase() as WatcherStatus }),
    }

    const [watchers, total] = await Promise.all([
      this.prisma.watcher.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.watcher.count({ where }),
    ])

    return {
      items: watchers,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async findById(userId: string, id: string) {
    const watcher = await this.prisma.watcher.findFirst({
      where: { id, userId },
      include: {
        alerts: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!watcher) {
      throw new NotFoundException('Watcher not found')
    }

    return watcher
  }

  async update(userId: string, id: string, dto: UpdateWatcherDto) {
    // Check if watcher exists and belongs to user
    const existing = await this.prisma.watcher.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      throw new NotFoundException('Watcher not found')
    }

    // If updating interval, check plan limits
    if (dto.interval) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      })

      const plan = user?.subscription?.plan || Plan.FREE
      const limits = PLAN_LIMITS[plan]

      if (dto.interval < limits.minInterval) {
        throw new BadRequestException(
          `Minimum check interval for your plan is ${limits.minInterval} seconds`,
        )
      }
    }

    const watcher = await this.prisma.watcher.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.rules && { rules: dto.rules as object }),
        ...(dto.interval && { interval: dto.interval }),
        ...(dto.status && { status: dto.status.toUpperCase() as WatcherStatus }),
      },
    })

    return watcher
  }

  async delete(userId: string, id: string) {
    const existing = await this.prisma.watcher.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      throw new NotFoundException('Watcher not found')
    }

    await this.prisma.watcher.delete({
      where: { id },
    })

    return { success: true }
  }

  async pause(userId: string, id: string) {
    return this.update(userId, id, { status: 'paused' })
  }

  async resume(userId: string, id: string) {
    return this.update(userId, id, { status: 'active' })
  }

  // Internal method for worker to get due watchers
  async getDueWatchers(limit: number = 100) {
    const now = new Date()

    return this.prisma.watcher.findMany({
      where: {
        status: WatcherStatus.ACTIVE,
        OR: [
          { lastCheckAt: null },
          {
            lastCheckAt: {
              lt: new Date(now.getTime() - 60 * 1000), // At least 1 minute ago
            },
          },
        ],
      },
      take: limit,
      orderBy: [
        { lastCheckAt: { sort: 'asc', nulls: 'first' } },
        { createdAt: 'asc' },
      ],
    })
  }

  // Internal method for worker to update watcher after check
  async updateAfterCheck(
    id: string,
    result: { success: boolean; data?: object; error?: string },
  ) {
    const update: {
      lastCheckAt: Date
      lastResult?: object
      errorCount?: number
      status?: WatcherStatus
    } = {
      lastCheckAt: new Date(),
    }

    if (result.success) {
      update.lastResult = result.data
      update.errorCount = 0
    } else {
      const watcher = await this.prisma.watcher.findUnique({ where: { id } })
      const newErrorCount = (watcher?.errorCount || 0) + 1
      update.errorCount = newErrorCount

      // Mark as error after 5 consecutive failures
      if (newErrorCount >= 5) {
        update.status = WatcherStatus.ERROR
      }
    }

    return this.prisma.watcher.update({
      where: { id },
      data: update,
    })
  }

  private extractDomain(url: string): string {
    try {
      const parsed = new URL(url)
      return parsed.hostname.replace(/^www\./, '')
    } catch {
      throw new BadRequestException('Invalid URL')
    }
  }

  private isDomainAllowed(domain: string): boolean {
    return ALLOWED_DOMAINS.some((allowed) => {
      if (allowed.startsWith('*.')) {
        const baseDomain = allowed.slice(2)
        return domain === baseDomain || domain.endsWith(`.${baseDomain}`)
      }
      return domain === allowed || domain === `www.${allowed}`
    })
  }
}
