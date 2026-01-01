import { Test, TestingModule } from '@nestjs/testing'
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common'

import { WatchersService } from './watchers.service'
import { PrismaService } from '../prisma/prisma.service'
import { Plan, WatcherStatus } from '@prisma/client'

describe('WatchersService', () => {
  let service: WatchersService
  let prismaService: jest.Mocked<PrismaService>

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    subscription: {
      plan: Plan.BASIC,
    },
    _count: {
      watchers: 5,
    },
  }

  const mockWatcher = {
    id: 'watcher-123',
    userId: 'user-123',
    url: 'https://example.com/product/123',
    name: 'Test Product',
    domain: 'example.com',
    rules: { stockStatus: true },
    interval: 300,
    status: WatcherStatus.ACTIVE,
    lastCheckAt: new Date(),
    lastResult: null,
    lastAlertAt: null,
    errorCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
      watcher: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get<WatchersService>(WatchersService)
    prismaService = module.get(PrismaService)
  })

  describe('create', () => {
    it('should create a watcher with valid URL', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce(mockUser)
      prismaService.watcher.create.mockResolvedValueOnce(mockWatcher)

      const result = await service.create('user-123', {
        url: 'https://example.com/product/123',
        name: 'Test Product',
        rules: { stockStatus: true },
        interval: 300,
      })

      expect(result).toEqual(mockWatcher)
      expect(prismaService.watcher.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          url: 'https://example.com/product/123',
          name: 'Test Product',
          domain: 'example.com',
        }),
      })
    })

    it('should reject watcher for blocked domain', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce(mockUser)

      await expect(
        service.create('user-123', {
          url: 'https://blocked-domain.com/product/123',
          name: 'Test Product',
          rules: {},
          interval: 300,
        })
      ).rejects.toThrow(BadRequestException)
    })

    it('should reject watcher if user has reached plan limit', async () => {
      const userAtLimit = {
        ...mockUser,
        _count: { watchers: 10 }, // Basic plan limit
      }
      prismaService.user.findUnique.mockResolvedValueOnce(userAtLimit)

      await expect(
        service.create('user-123', {
          url: 'https://example.com/product/123',
          name: 'Test Product',
          rules: {},
          interval: 300,
        })
      ).rejects.toThrow(ForbiddenException)
    })

    it('should reject watcher with interval below plan minimum', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce(mockUser)

      await expect(
        service.create('user-123', {
          url: 'https://example.com/product/123',
          name: 'Test Product',
          rules: {},
          interval: 60, // Basic plan minimum is 300
        })
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw NotFoundException for non-existent user', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce(null)

      await expect(
        service.create('nonexistent-user', {
          url: 'https://example.com/product/123',
          name: 'Test Product',
          rules: {},
          interval: 300,
        })
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('findAll', () => {
    it('should return paginated watchers', async () => {
      const watchers = [mockWatcher]
      prismaService.watcher.findMany.mockResolvedValueOnce(watchers)
      prismaService.watcher.count.mockResolvedValueOnce(1)

      const result = await service.findAll('user-123', { page: 1, limit: 20 })

      expect(result.items).toEqual(watchers)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
    })

    it('should filter by status', async () => {
      prismaService.watcher.findMany.mockResolvedValueOnce([mockWatcher])
      prismaService.watcher.count.mockResolvedValueOnce(1)

      await service.findAll('user-123', { page: 1, limit: 20, status: 'active' })

      expect(prismaService.watcher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: WatcherStatus.ACTIVE,
          }),
        })
      )
    })
  })

  describe('findById', () => {
    it('should return watcher with alerts', async () => {
      const watcherWithAlerts = { ...mockWatcher, alerts: [] }
      prismaService.watcher.findFirst.mockResolvedValueOnce(watcherWithAlerts)

      const result = await service.findById('user-123', 'watcher-123')

      expect(result).toEqual(watcherWithAlerts)
    })

    it('should throw NotFoundException if watcher not found', async () => {
      prismaService.watcher.findFirst.mockResolvedValueOnce(null)

      await expect(
        service.findById('user-123', 'nonexistent-watcher')
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update watcher name', async () => {
      prismaService.watcher.findFirst.mockResolvedValueOnce(mockWatcher)
      prismaService.watcher.update.mockResolvedValueOnce({
        ...mockWatcher,
        name: 'Updated Name',
      })

      const result = await service.update('user-123', 'watcher-123', {
        name: 'Updated Name',
      })

      expect(result.name).toBe('Updated Name')
    })

    it('should reject interval update below plan minimum', async () => {
      prismaService.watcher.findFirst.mockResolvedValueOnce(mockWatcher)
      prismaService.user.findUnique.mockResolvedValueOnce(mockUser)

      await expect(
        service.update('user-123', 'watcher-123', {
          interval: 60,
        })
      ).rejects.toThrow(BadRequestException)
    })

    it('should throw NotFoundException if watcher not found', async () => {
      prismaService.watcher.findFirst.mockResolvedValueOnce(null)

      await expect(
        service.update('user-123', 'nonexistent-watcher', { name: 'New Name' })
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('delete', () => {
    it('should delete watcher successfully', async () => {
      prismaService.watcher.findFirst.mockResolvedValueOnce(mockWatcher)
      prismaService.watcher.delete.mockResolvedValueOnce(mockWatcher)

      const result = await service.delete('user-123', 'watcher-123')

      expect(result).toEqual({ success: true })
    })

    it('should throw NotFoundException if watcher not found', async () => {
      prismaService.watcher.findFirst.mockResolvedValueOnce(null)

      await expect(
        service.delete('user-123', 'nonexistent-watcher')
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('pause and resume', () => {
    it('should pause watcher', async () => {
      prismaService.watcher.findFirst.mockResolvedValueOnce(mockWatcher)
      prismaService.watcher.update.mockResolvedValueOnce({
        ...mockWatcher,
        status: WatcherStatus.PAUSED,
      })

      const result = await service.pause('user-123', 'watcher-123')

      expect(result.status).toBe(WatcherStatus.PAUSED)
    })

    it('should resume watcher', async () => {
      const pausedWatcher = { ...mockWatcher, status: WatcherStatus.PAUSED }
      prismaService.watcher.findFirst.mockResolvedValueOnce(pausedWatcher)
      prismaService.watcher.update.mockResolvedValueOnce({
        ...pausedWatcher,
        status: WatcherStatus.ACTIVE,
      })

      const result = await service.resume('user-123', 'watcher-123')

      expect(result.status).toBe(WatcherStatus.ACTIVE)
    })
  })

  describe('getDueWatchers', () => {
    it('should return watchers that need checking', async () => {
      const dueWatchers = [mockWatcher]
      prismaService.watcher.findMany.mockResolvedValueOnce(dueWatchers)

      const result = await service.getDueWatchers(100)

      expect(result).toEqual(dueWatchers)
      expect(prismaService.watcher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: WatcherStatus.ACTIVE,
          }),
          take: 100,
        })
      )
    })
  })
})
