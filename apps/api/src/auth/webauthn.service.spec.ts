import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { ConflictException, BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common'

import { WebAuthnService } from './webauthn.service'
import { PrismaService } from '../prisma/prisma.service'
import { Plan, SubscriptionStatus, Role } from '@prisma/client'

// Mock the @simplewebauthn/server module
jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn().mockResolvedValue({
    challenge: 'test-challenge-123',
    rp: { name: 'Shopping Assistant', id: 'localhost' },
    user: { id: 'user-id', name: 'test@example.com', displayName: 'Test User' },
  }),
  verifyRegistrationResponse: jest.fn().mockResolvedValue({
    verified: true,
    registrationInfo: {
      credential: {
        id: new Uint8Array([1, 2, 3, 4]),
        publicKey: new Uint8Array([5, 6, 7, 8]),
        counter: 0,
        transports: ['internal'],
      },
      credentialDeviceType: 'singleDevice',
      credentialBackedUp: false,
    },
  }),
  generateAuthenticationOptions: jest.fn().mockResolvedValue({
    challenge: 'test-auth-challenge-456',
    allowCredentials: [],
  }),
  verifyAuthenticationResponse: jest.fn().mockResolvedValue({
    verified: true,
    authenticationInfo: {
      newCounter: 1,
    },
  }),
}))

describe('WebAuthnService', () => {
  let service: WebAuthnService
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prismaService: any

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: null,
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
    authenticators: [
      {
        id: 'auth-123',
        userId: 'user-123',
        credentialId: 'Y3JlZGVudGlhbC1pZC0xMjM', // base64url encoded
        credentialPublicKey: Buffer.from([1, 2, 3, 4]),
        counter: BigInt(0),
        credentialDeviceType: 'singleDevice',
        credentialBackedUp: false,
        transports: ['internal'],
        name: 'Test Passkey',
        createdAt: new Date(),
        lastUsedAt: null,
      },
    ],
  }

  const mockChallenge = {
    id: 'challenge-123',
    challenge: 'test-challenge-123',
    userId: 'user-123',
    email: 'test@example.com',
    type: 'registration',
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    createdAt: new Date(),
  }

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      webAuthnChallenge: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      authenticator: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    }

    const mockJwt = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    }

    const mockConfig = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          JWT_SECRET: 'test-secret',
          WEBAUTHN_RP_NAME: 'Shopping Assistant',
          WEBAUTHN_RP_ID: 'localhost',
          WEBAUTHN_ORIGIN: 'http://localhost:3000',
        }
        return config[key]
      }),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebAuthnService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile()

    service = module.get<WebAuthnService>(WebAuthnService)
    prismaService = module.get(PrismaService)
  })

  describe('startRegistration', () => {
    it('should start registration for a new user', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce(null)
      prismaService.webAuthnChallenge.create.mockResolvedValueOnce(mockChallenge)

      const result = await service.startRegistration({
        email: 'test@example.com',
        name: 'Test User',
      })

      expect(result).toHaveProperty('challengeId')
      expect(result).toHaveProperty('options')
      expect(prismaService.webAuthnChallenge.create).toHaveBeenCalled()
    })

    it('should throw ConflictException if user already exists', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce(mockUser)

      await expect(
        service.startRegistration({
          email: 'test@example.com',
          name: 'Test User',
        })
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('startAuthentication', () => {
    it('should start authentication for existing user with passkeys', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce(mockUser)
      prismaService.webAuthnChallenge.create.mockResolvedValueOnce({
        ...mockChallenge,
        type: 'authentication',
      })

      const result = await service.startAuthentication({
        email: 'test@example.com',
      })

      expect(result).toHaveProperty('challengeId')
      expect(result).toHaveProperty('options')
    })

    it('should throw UnauthorizedException for non-existent user', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce(null)

      await expect(
        service.startAuthentication({
          email: 'nonexistent@example.com',
        })
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should throw BadRequestException if user has no passkeys', async () => {
      prismaService.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        authenticators: [],
      })

      await expect(
        service.startAuthentication({
          email: 'test@example.com',
        })
      ).rejects.toThrow(BadRequestException)
    })
  })

  describe('getPasskeys', () => {
    it('should return list of passkeys for user', async () => {
      prismaService.authenticator.findMany.mockResolvedValueOnce([
        {
          id: 'auth-123',
          name: 'Test Passkey',
          credentialDeviceType: 'singleDevice',
          createdAt: new Date(),
          lastUsedAt: null,
        },
      ])

      const result = await service.getPasskeys('user-123')

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Test Passkey')
    })
  })

  describe('deletePasskey', () => {
    it('should delete passkey when user has multiple passkeys', async () => {
      prismaService.authenticator.findFirst.mockResolvedValueOnce(mockUser.authenticators[0])
      prismaService.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        authenticators: [mockUser.authenticators[0], { ...mockUser.authenticators[0], id: 'auth-456' }],
      })
      prismaService.authenticator.delete.mockResolvedValueOnce({})
      prismaService.auditLog.create.mockResolvedValueOnce({})

      const result = await service.deletePasskey('user-123', 'auth-123')

      expect(result).toEqual({ success: true })
      expect(prismaService.authenticator.delete).toHaveBeenCalled()
    })

    it('should throw NotFoundException for non-existent passkey', async () => {
      prismaService.authenticator.findFirst.mockResolvedValueOnce(null)

      await expect(service.deletePasskey('user-123', 'nonexistent')).rejects.toThrow(NotFoundException)
    })

    it('should throw BadRequestException when deleting last passkey without password', async () => {
      prismaService.authenticator.findFirst.mockResolvedValueOnce(mockUser.authenticators[0])
      prismaService.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        passwordHash: null,
        authenticators: [mockUser.authenticators[0]],
      })

      await expect(service.deletePasskey('user-123', 'auth-123')).rejects.toThrow(BadRequestException)
    })
  })

  describe('renamePasskey', () => {
    it('should rename passkey successfully', async () => {
      prismaService.authenticator.findFirst.mockResolvedValueOnce(mockUser.authenticators[0])
      prismaService.authenticator.update.mockResolvedValueOnce({
        ...mockUser.authenticators[0],
        name: 'New Name',
      })

      const result = await service.renamePasskey('user-123', 'auth-123', 'New Name')

      expect(result.name).toBe('New Name')
    })

    it('should throw NotFoundException for non-existent passkey', async () => {
      prismaService.authenticator.findFirst.mockResolvedValueOnce(null)

      await expect(service.renamePasskey('user-123', 'nonexistent', 'New Name')).rejects.toThrow(NotFoundException)
    })
  })

  describe('cleanupExpiredChallenges', () => {
    it('should delete expired challenges', async () => {
      prismaService.webAuthnChallenge.deleteMany.mockResolvedValueOnce({ count: 5 })

      const result = await service.cleanupExpiredChallenges()

      expect(result).toEqual({ deleted: 5 })
    })
  })
})
