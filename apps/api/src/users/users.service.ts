import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateUserDto } from './dto'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        subscription: true,
      },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.subscription?.plan || 'FREE',
      createdAt: user.createdAt,
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
      },
      include: {
        subscription: true,
      },
    })

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.subscription?.plan || 'FREE',
    }
  }

  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        subscription: true,
        _count: {
          select: {
            watchers: true,
            alerts: true,
          },
        },
      },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.subscription?.plan || 'FREE',
      subscription: user.subscription
        ? {
            status: user.subscription.status,
            currentPeriodEnd: user.subscription.currentPeriodEnd,
            cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
          }
        : null,
      stats: {
        watchersCount: user._count.watchers,
        alertsCount: user._count.alerts,
      },
      createdAt: user.createdAt,
    }
  }

  // Admin methods
  async findAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        include: {
          subscription: true,
          _count: {
            select: {
              watchers: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ])

    return {
      items: users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.subscription?.plan || 'FREE',
        watchersCount: user._count.watchers,
        createdAt: user.createdAt,
      })),
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async getStats() {
    const [totalUsers, planCounts, recentSignups] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.subscription.groupBy({
        by: ['plan'],
        _count: true,
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ])

    return {
      totalUsers,
      planBreakdown: planCounts.reduce(
        (acc, curr) => {
          acc[curr.plan] = curr._count
          return acc
        },
        {} as Record<string, number>,
      ),
      recentSignups,
    }
  }
}
