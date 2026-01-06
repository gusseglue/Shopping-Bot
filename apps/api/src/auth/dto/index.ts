import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsObject } from 'class-validator'

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  password: string

  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  name?: string
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string
}

export enum DevicePlatformDto {
  WINDOWS = 'WINDOWS',
  MACOS = 'MACOS',
  LINUX = 'LINUX',
  WEB = 'WEB',
}

export class RegisterDeviceDto {
  @ApiProperty({ example: 'My Windows PC' })
  @IsString()
  name: string

  @ApiProperty({ example: 'abc123fingerprint' })
  @IsString()
  @MinLength(16)
  fingerprint: string

  @ApiProperty({ enum: DevicePlatformDto, example: DevicePlatformDto.WINDOWS })
  @IsEnum(DevicePlatformDto)
  platform: DevicePlatformDto
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string

  @ApiProperty()
  refreshToken: string

  @ApiProperty()
  expiresIn: number

  @ApiProperty()
  user: {
    id: string
    email: string
    name: string | null
    role: string
    plan: string
  }
}

export class VerifyResponseDto {
  @ApiProperty()
  valid: boolean

  @ApiProperty()
  user: {
    id: string
    email: string
    role: string
    plan: string
  }

  @ApiProperty()
  subscription: {
    plan: string
    status: string
    expiresAt: Date | null
  }
}

// WebAuthn DTOs
export class WebAuthnRegistrationStartDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'John Doe', required: false })
  @IsString()
  @IsOptional()
  name?: string
}

export class WebAuthnRegistrationFinishDto {
  @ApiProperty({ description: 'The challenge ID returned from registration start' })
  @IsString()
  challengeId: string

  @ApiProperty({ description: 'The credential response from the authenticator' })
  @IsObject()
  credential: object

  @ApiProperty({ example: 'My MacBook Passkey', required: false })
  @IsString()
  @IsOptional()
  passkeyName?: string
}

export class WebAuthnAuthenticationStartDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string
}

export class WebAuthnAuthenticationFinishDto {
  @ApiProperty({ description: 'The challenge ID returned from authentication start' })
  @IsString()
  challengeId: string

  @ApiProperty({ description: 'The credential response from the authenticator' })
  @IsObject()
  credential: object
}

export class WebAuthnAddPasskeyStartDto {
  @ApiProperty({ example: 'My iPhone Passkey', required: false })
  @IsString()
  @IsOptional()
  passkeyName?: string
}

export class WebAuthnAddPasskeyFinishDto {
  @ApiProperty({ description: 'The challenge ID returned from add passkey start' })
  @IsString()
  challengeId: string

  @ApiProperty({ description: 'The credential response from the authenticator' })
  @IsObject()
  credential: object

  @ApiProperty({ example: 'My iPhone Passkey', required: false })
  @IsString()
  @IsOptional()
  passkeyName?: string
}

export class PasskeyDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  name: string | null

  @ApiProperty()
  credentialDeviceType: string

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  lastUsedAt: Date | null
}
