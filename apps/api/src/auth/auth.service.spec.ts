import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { ConflictException, UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'

import { AuthService } from './auth.service'
import { PrismaService } from '../prisma/prisma.service'
import { Plan, SubscriptionStatus, Role } from '@prisma/client'

describe('AuthService', () => {
  let service: AuthService
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prismaService: any

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: '$2b$12$hashedpassword',
    name: 'Test User',
    role: Role.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    subscription: {
      id: 'sub-123',
      userId: 'user-123',
      plan: Plan.BASIC,
      status: SubscriptionStatus.ACTIVE,
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: null,
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
        create: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      device: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    }

    const mockJwt = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    }

    const mockConfig = {
      get: jest.fn().mockReturnValue('test-secret'),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    prismaService = module.get(PrismaService)
  })

  describe('register', () => {
    it('should register a new user successfully', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce(null)
      prismaService.user.create.mockResolvedValueOnce(mockUser)
      prismaService.refreshToken.create.mockResolvedValueOnce({
        id: 'rt-123',
        token: 'refresh-token',
        userId: mockUser.id,
        deviceId: null,
        expiresAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
      })
      prismaService.auditLog.create.mockResolvedValueOnce({} as any)

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      })

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(result.user.email).toBe('test@example.com')
      expect(prismaService.user.create).toHaveBeenCalled()
    })

    it('should throw ConflictException if user already exists', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce(mockUser)

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 12)
      const userWithHash = { ...mockUser, passwordHash: hashedPassword }

      prismaService.user.findUnique.mockResolvedValueOnce(userWithHash)
      prismaService.refreshToken.create.mockResolvedValueOnce({
        id: 'rt-123',
        token: 'refresh-token',
        userId: mockUser.id,
        deviceId: null,
        expiresAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
      })
      prismaService.auditLog.create.mockResolvedValueOnce({} as any)

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(result.user.email).toBe('test@example.com')
    })

    it('should throw UnauthorizedException for invalid email', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce(null)

      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException for invalid password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 12)
      const userWithHash = { ...mockUser, passwordHash: hashedPassword }

      prismaService.user.findUnique.mockResolvedValueOnce(userWithHash)

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const storedToken = {
        id: 'rt-123',
        token: 'valid-refresh-token',
        userId: mockUser.id,
        deviceId: null,
        expiresAt: new Date(Date.now() + 86400000), // 1 day from now
        revokedAt: null,
        createdAt: new Date(),
        user: mockUser,
      }

      prismaService.refreshToken.findUnique.mockResolvedValueOnce(storedToken)
      prismaService.refreshToken.update.mockResolvedValueOnce({
        ...storedToken,
        revokedAt: new Date(),
      })
      prismaService.refreshToken.create.mockResolvedValueOnce({
        id: 'rt-456',
        token: 'new-refresh-token',
        userId: mockUser.id,
        deviceId: null,
        expiresAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
      })
      prismaService.auditLog.create.mockResolvedValueOnce({} as any)

      const result = await service.refreshToken({
        refreshToken: 'valid-refresh-token',
      })

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
    })

    it('should throw UnauthorizedException for expired token', async () => {
      const storedToken = {
        id: 'rt-123',
        token: 'expired-refresh-token',
        userId: mockUser.id,
        deviceId: null,
        expiresAt: new Date(Date.now() - 86400000), // 1 day ago
        revokedAt: null,
        createdAt: new Date(),
        user: mockUser,
      }

      prismaService.refreshToken.findUnique.mockResolvedValueOnce(storedToken)

      await expect(
        service.refreshToken({
          refreshToken: 'expired-refresh-token',
        })
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException for revoked token', async () => {
      const storedToken = {
        id: 'rt-123',
        token: 'revoked-refresh-token',
        userId: mockUser.id,
        deviceId: null,
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: new Date(), // Already revoked
        createdAt: new Date(),
        user: mockUser,
      }

      prismaService.refreshToken.findUnique.mockResolvedValueOnce(storedToken)

      await expect(
        service.refreshToken({
          refreshToken: 'revoked-refresh-token',
        })
      ).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('verify', () => {
    it('should verify a valid user', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce(mockUser)

      const result = await service.verify(mockUser.id)

      expect(result.valid).toBe(true)
      expect(result.user.id).toBe(mockUser.id)
      expect(result.subscription.plan).toBe(Plan.BASIC)
    })

    it('should throw UnauthorizedException for non-existent user', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce(null)

      await expect(service.verify('nonexistent-id')).rejects.toThrow(
        UnauthorizedException
      )
    })
  })
})
