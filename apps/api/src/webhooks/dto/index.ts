import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsUrl, IsEnum, IsBoolean, IsOptional } from 'class-validator'

export class CreateWebhookDto {
  @ApiProperty({ enum: ['discord', 'slack', 'custom'] })
  @IsEnum(['discord', 'slack', 'custom'])
  type: 'discord' | 'slack' | 'custom'

  @ApiProperty({ example: 'https://discord.com/api/webhooks/...' })
  @IsUrl()
  url: string
}

export class UpdateWebhookDto {
  @ApiProperty({ required: false })
  @IsUrl()
  @IsOptional()
  url?: string

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean
}

export class TestWebhookDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  message?: string
}
