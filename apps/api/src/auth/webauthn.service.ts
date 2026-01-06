import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import type {
  AuthenticatorTransportFuture,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types'
import { v4 as uuidv4 } from 'uuid'

import { PrismaService } from '../prisma/prisma.service'
import {
  WebAuthnRegistrationStartDto,
  WebAuthnRegistrationFinishDto,
  WebAuthnAuthenticationStartDto,
  WebAuthnAuthenticationFinishDto,
  WebAuthnAddPasskeyFinishDto,
} from './dto'
import { Plan, SubscriptionStatus } from '@prisma/client'

@Injectable()
export class WebAuthnService {
  private readonly rpName: string
  private readonly rpID: string
  private readonly origin: string

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    // WebAuthn Relying Party configuration
    this.rpName = this.configService.get<string>('WEBAUTHN_RP_NAME') || 'Shopping Assistant'
    this.rpID = this.configService.get<string>('WEBAUTHN_RP_ID') || 'localhost'
    this.origin = this.configService.get<string>('WEBAUTHN_ORIGIN') || 'http://localhost:3000'
  }

  /**
   * Start registration for a new user with a passkey
   */
  async startRegistration(dto: WebAuthnRegistrationStartDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })

    if (existingUser) {
      throw new ConflictException('User with this email already exists')
    }

    // Generate registration options
    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userName: dto.email,
      userDisplayName: dto.name || dto.email,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
      timeout: 60000,
    })

    // Store challenge in database
    const challengeExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    const challenge = await this.prisma.webAuthnChallenge.create({
      data: {
        challenge: options.challenge,
        email: dto.email,
        userName: dto.name,
        type: 'registration',
        expiresAt: challengeExpiry,
      },
    })

    return {
      challengeId: challenge.id,
      options,
    }
  }

  /**
   * Complete registration for a new user with a passkey
   */
  async finishRegistration(dto: WebAuthnRegistrationFinishDto) {
    // Find and validate challenge
    const challenge = await this.prisma.webAuthnChallenge.findUnique({
      where: { id: dto.challengeId },
    })

    if (!challenge || challenge.type !== 'registration') {
      throw new BadRequestException('Invalid challenge')
    }

    if (challenge.expiresAt < new Date()) {
      await this.prisma.webAuthnChallenge.delete({ where: { id: challenge.id } })
      throw new BadRequestException('Challenge expired')
    }

    if (!challenge.email) {
      throw new BadRequestException('Invalid challenge: missing email')
    }

    // Verify the credential
    let verification
    try {
      verification = await verifyRegistrationResponse({
        response: dto.credential as RegistrationResponseJSON,
        expectedChallenge: challenge.challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
      })
    } catch (error) {
      throw new BadRequestException(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    if (!verification.verified || !verification.registrationInfo) {
      throw new BadRequestException('Registration verification failed')
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo

    // Create user with passkey
    const user = await this.prisma.user.create({
      data: {
        email: challenge.email,
        name: challenge.userName,
        subscription: {
          create: {
            stripeCustomerId: `cus_${uuidv4().replace(/-/g, '').substring(0, 14)}`,
            plan: Plan.FREE,
            status: SubscriptionStatus.ACTIVE,
          },
        },
        authenticators: {
          create: {
            credentialId: Buffer.from(credential.id).toString('base64url'),
            credentialPublicKey: Buffer.from(credential.publicKey),
            counter: BigInt(credential.counter),
            credentialDeviceType,
            credentialBackedUp,
            transports: (credential.transports || []) as string[],
            name: dto.passkeyName || 'Default Passkey',
          },
        },
      },
      include: {
        subscription: true,
      },
    })

    // Delete the used challenge
    await this.prisma.webAuthnChallenge.delete({ where: { id: challenge.id } })

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role)

    // Create audit log
    await this.createAuditLog(user.id, 'login', { method: 'webauthn_register' })

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

  /**
   * Start authentication with a passkey
   */
  async startAuthentication(dto: WebAuthnAuthenticationStartDto) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        authenticators: true,
      },
    })

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    if (user.authenticators.length === 0) {
      throw new BadRequestException('No passkeys registered for this account')
    }

    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      allowCredentials: user.authenticators.map((auth) => ({
        id: auth.credentialId,
        transports: auth.transports as AuthenticatorTransportFuture[],
      })),
      userVerification: 'preferred',
      timeout: 60000,
    })

    // Store challenge
    const challengeExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    const challenge = await this.prisma.webAuthnChallenge.create({
      data: {
        challenge: options.challenge,
        userId: user.id,
        type: 'authentication',
        expiresAt: challengeExpiry,
      },
    })

    return {
      challengeId: challenge.id,
      options,
    }
  }

  /**
   * Complete authentication with a passkey
   */
  async finishAuthentication(dto: WebAuthnAuthenticationFinishDto) {
    // Find and validate challenge
    const challenge = await this.prisma.webAuthnChallenge.findUnique({
      where: { id: dto.challengeId },
    })

    if (!challenge || challenge.type !== 'authentication') {
      throw new BadRequestException('Invalid challenge')
    }

    if (challenge.expiresAt < new Date()) {
      await this.prisma.webAuthnChallenge.delete({ where: { id: challenge.id } })
      throw new BadRequestException('Challenge expired')
    }

    if (!challenge.userId) {
      throw new BadRequestException('Invalid challenge: missing user')
    }

    // Find the user and their authenticators
    const user = await this.prisma.user.findUnique({
      where: { id: challenge.userId },
      include: {
        authenticators: true,
        subscription: true,
      },
    })

    if (!user) {
      throw new UnauthorizedException('User not found')
    }

    // Get the credential ID from the response
    const credentialResponse = dto.credential as AuthenticationResponseJSON
    const credentialId = credentialResponse.id

    // Find the authenticator
    const authenticator = user.authenticators.find(
      (auth) => auth.credentialId === credentialId
    )

    if (!authenticator) {
      throw new BadRequestException('Authenticator not found')
    }

    // Verify the authentication response
    let verification
    try {
      verification = await verifyAuthenticationResponse({
        response: credentialResponse,
        expectedChallenge: challenge.challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        credential: {
          id: authenticator.credentialId,
          publicKey: authenticator.credentialPublicKey,
          counter: Number(authenticator.counter),
          transports: authenticator.transports as AuthenticatorTransportFuture[],
        },
      })
    } catch (error) {
      throw new BadRequestException(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    if (!verification.verified) {
      throw new UnauthorizedException('Authentication verification failed')
    }

    // Update counter
    await this.prisma.authenticator.update({
      where: { id: authenticator.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      },
    })

    // Delete the used challenge
    await this.prisma.webAuthnChallenge.delete({ where: { id: challenge.id } })

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role)

    // Create audit log
    await this.createAuditLog(user.id, 'login', { method: 'webauthn' })

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

  /**
   * Start adding a passkey to an existing account
   */
  async startAddPasskey(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        authenticators: true,
      },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    // Generate registration options excluding existing credentials
    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userName: user.email,
      userDisplayName: user.name || user.email,
      attestationType: 'none',
      excludeCredentials: user.authenticators.map((auth) => ({
        id: auth.credentialId,
        transports: auth.transports as AuthenticatorTransportFuture[],
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      timeout: 60000,
    })

    // Store challenge
    const challengeExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    const challenge = await this.prisma.webAuthnChallenge.create({
      data: {
        challenge: options.challenge,
        userId: user.id,
        type: 'registration',
        expiresAt: challengeExpiry,
      },
    })

    return {
      challengeId: challenge.id,
      options,
    }
  }

  /**
   * Complete adding a passkey to an existing account
   */
  async finishAddPasskey(userId: string, dto: WebAuthnAddPasskeyFinishDto) {
    // Find and validate challenge
    const challenge = await this.prisma.webAuthnChallenge.findUnique({
      where: { id: dto.challengeId },
    })

    if (!challenge || challenge.type !== 'registration') {
      throw new BadRequestException('Invalid challenge')
    }

    if (challenge.expiresAt < new Date()) {
      await this.prisma.webAuthnChallenge.delete({ where: { id: challenge.id } })
      throw new BadRequestException('Challenge expired')
    }

    if (challenge.userId !== userId) {
      throw new BadRequestException('Challenge does not belong to this user')
    }

    // Verify the credential
    let verification
    try {
      verification = await verifyRegistrationResponse({
        response: dto.credential as RegistrationResponseJSON,
        expectedChallenge: challenge.challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
      })
    } catch (error) {
      throw new BadRequestException(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    if (!verification.verified || !verification.registrationInfo) {
      throw new BadRequestException('Registration verification failed')
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo

    // Add the new authenticator
    const authenticator = await this.prisma.authenticator.create({
      data: {
        userId,
        credentialId: Buffer.from(credential.id).toString('base64url'),
        credentialPublicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter),
        credentialDeviceType,
        credentialBackedUp,
        transports: (credential.transports || []) as string[],
        name: dto.passkeyName || `Passkey ${new Date().toLocaleDateString()}`,
      },
    })

    // Delete the used challenge
    await this.prisma.webAuthnChallenge.delete({ where: { id: challenge.id } })

    // Create audit log
    await this.createAuditLog(userId, 'passkey_added', {
      authenticatorId: authenticator.id,
    })

    return {
      id: authenticator.id,
      name: authenticator.name,
      credentialDeviceType: authenticator.credentialDeviceType,
      createdAt: authenticator.createdAt,
    }
  }

  /**
   * Get all passkeys for a user
   */
  async getPasskeys(userId: string) {
    const authenticators = await this.prisma.authenticator.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        credentialDeviceType: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return authenticators
  }

  /**
   * Delete a passkey
   */
  async deletePasskey(userId: string, passkeyId: string) {
    const authenticator = await this.prisma.authenticator.findFirst({
      where: {
        id: passkeyId,
        userId,
      },
    })

    if (!authenticator) {
      throw new NotFoundException('Passkey not found')
    }

    // Check if this is the last passkey and user has no password
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { authenticators: true },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    if (user.authenticators.length === 1 && !user.passwordHash) {
      throw new BadRequestException(
        'Cannot delete the last passkey when no password is set. Add a password or another passkey first.'
      )
    }

    await this.prisma.authenticator.delete({
      where: { id: passkeyId },
    })

    // Create audit log
    await this.createAuditLog(userId, 'passkey_deleted', {
      authenticatorId: passkeyId,
    })

    return { success: true }
  }

  /**
   * Rename a passkey
   */
  async renamePasskey(userId: string, passkeyId: string, newName: string) {
    const authenticator = await this.prisma.authenticator.findFirst({
      where: {
        id: passkeyId,
        userId,
      },
    })

    if (!authenticator) {
      throw new NotFoundException('Passkey not found')
    }

    const updated = await this.prisma.authenticator.update({
      where: { id: passkeyId },
      data: { name: newName },
    })

    return {
      id: updated.id,
      name: updated.name,
      credentialDeviceType: updated.credentialDeviceType,
      createdAt: updated.createdAt,
      lastUsedAt: updated.lastUsedAt,
    }
  }

  /**
   * Clean up expired challenges (can be called periodically)
   */
  async cleanupExpiredChallenges() {
    const result = await this.prisma.webAuthnChallenge.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    })
    return { deleted: result.count }
  }

  private async generateTokens(userId: string, email: string, role: string, deviceId?: string) {
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
        metadata: metadata as object,
        ipAddress,
        userAgent,
      },
    })
  }
}
