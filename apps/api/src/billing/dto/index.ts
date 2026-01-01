import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsEnum } from 'class-validator'

export class CreateCheckoutSessionDto {
  @ApiProperty({ enum: ['basic', 'pro'] })
  @IsEnum(['basic', 'pro'])
  plan: 'basic' | 'pro'
}

export class StripeWebhookDto {
  @ApiProperty()
  @IsString()
  rawBody: string

  @ApiProperty()
  @IsString()
  signature: string
}
