import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsEnum, IsString, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class AlertQueryDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number

  @ApiProperty({
    enum: ['price_change', 'back_in_stock', 'size_available', 'error'],
    required: false,
  })
  @IsEnum(['price_change', 'back_in_stock', 'size_available', 'error'])
  @IsOptional()
  type?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  watcherId?: string

  @ApiProperty({ required: false })
  @IsOptional()
  unreadOnly?: boolean
}

export class CreateAlertDto {
  @ApiProperty()
  @IsString()
  watcherId: string

  @ApiProperty({ enum: ['price_change', 'back_in_stock', 'size_available', 'error'] })
  @IsEnum(['price_change', 'back_in_stock', 'size_available', 'error'])
  type: 'price_change' | 'back_in_stock' | 'size_available' | 'error'

  @ApiProperty()
  data: {
    productName: string
    productUrl: string
    previousValue?: string | number
    currentValue?: string | number
    message?: string
  }
}
