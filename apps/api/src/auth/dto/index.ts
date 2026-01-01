import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator'

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
