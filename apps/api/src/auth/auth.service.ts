import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'

import { PrismaService } from '../prisma/prisma.service'
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDeviceDto,
  DevicePlatformDto,
} from './dto'
import { Plan, SubscriptionStatus, DevicePlatform } from '@prisma/client'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })

    if (existingUser) {
      throw new ConflictException('User with this email already exists')
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12)

    // Create user with free subscription
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        subscription: {
          create: {
            stripeCustomerId: `cus_${uuidv4().replace(/-/g, '').substring(0, 14)}`,
            plan: Plan.FREE,
            status: SubscriptionStatus.ACTIVE,
          },
        },
      },
      include: {
        subscription: true,
      },
    })

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role)

    // Create audit log
    await this.createAuditLog(user.id, 'login', { method: 'register' })

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.subscription?.plan || 'FREE',
      },
    }
  }

  async login(dto: LoginDto) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        subscription: true,
      },
    })

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash)

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role)

    // Create audit log
    await this.createAuditLog(user.id, 'login', { method: 'password' })

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.subscription?.plan || 'FREE',
      },
    }
  }

  async refreshToken(dto: RefreshTokenDto) {
    // Find refresh token
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: {
        user: {
          include: {
            subscription: true,
          },
        },
      },
    })

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token')
    }

    // Revoke old refresh token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    })

    // Generate new tokens
    const tokens = await this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
      storedToken.deviceId ?? undefined,
    )

    // Create audit log
    await this.createAuditLog(storedToken.user.id, 'token_refresh', {
      deviceId: storedToken.deviceId,
    })

    return {
      ...tokens,
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        name: storedToken.user.name,
        role: storedToken.user.role,
        plan: storedToken.user.subscription?.plan || 'FREE',
      },
    }
  }

  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    // Check if device already exists
    const existingDevice = await this.prisma.device.findUnique({
      where: {
        userId_fingerprint: {
          userId,
          fingerprint: dto.fingerprint,
        },
      },
    })

    if (existingDevice) {
      // Update last seen
      await this.prisma.device.update({
        where: { id: existingDevice.id },
        data: { lastSeenAt: new Date() },
      })

      return existingDevice
    }

    // Create new device
    const device = await this.prisma.device.create({
      data: {
        userId,
        name: dto.name,
        fingerprint: dto.fingerprint,
        platform: dto.platform as DevicePlatform,
      },
    })

    // Create audit log
    await this.createAuditLog(userId, 'device_registered', {
      deviceId: device.id,
      platform: dto.platform,
    })

    return device
  }

  async revokeDevice(userId: string, deviceId: string) {
    const device = await this.prisma.device.findFirst({
      where: {
        id: deviceId,
        userId,
      },
    })

    if (!device) {
      throw new NotFoundException('Device not found')
    }

    // Revoke all refresh tokens for this device
    await this.prisma.refreshToken.updateMany({
      where: { deviceId },
      data: { revokedAt: new Date() },
    })

    // Mark device as revoked
    await this.prisma.device.update({
      where: { id: deviceId },
      data: { revokedAt: new Date() },
    })

    // Create audit log
    await this.createAuditLog(userId, 'device_revoked', { deviceId })

    return { success: true }
  }

  async getUserDevices(userId: string) {
    return this.prisma.device.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      orderBy: { lastSeenAt: 'desc' },
    })
  }

  async verify(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    return {
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        plan: user.subscription?.plan || 'FREE',
      },
      subscription: {
        plan: user.subscription?.plan || 'FREE',
        status: user.subscription?.status || 'ACTIVE',
        expiresAt: user.subscription?.currentPeriodEnd || null,
      },
    }
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, token: refreshToken },
        data: { revokedAt: new Date() },
      })
    }

    await this.createAuditLog(userId, 'logout', {})

    return { success: true }
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    deviceId?: string,
  ) {
    const payload = {
      sub: userId,
      email,
      role,
      deviceId,
    }

    const accessToken = this.jwtService.sign(payload)

    // Create refresh token
    const refreshTokenValue = uuidv4()
    const refreshTokenExpiry = new Date()
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7) // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        deviceId,
        token: refreshTokenValue,
        expiresAt: refreshTokenExpiry,
      },
    })

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: 900, // 15 minutes in seconds
    }
  }

  private async createAuditLog(
    userId: string,
    action: string,
    metadata: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        metadata,
        ipAddress,
        userAgent,
      },
    })
  }
}
