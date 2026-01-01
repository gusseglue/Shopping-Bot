import { ApiProperty } from '@nestjs/swagger'
import {
  IsString,
  IsUrl,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  ValidateNested,
  Min,
  Max,
  MaxLength,
} from 'class-validator'
import { Type } from 'class-transformer'

export class PriceRuleDto {
  @ApiProperty({ enum: ['below', 'above', 'change'] })
  @IsEnum(['below', 'above', 'change'])
  type: 'below' | 'above' | 'change'

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  value?: number

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  percentage?: number
}

export class WatcherRulesDto {
  @ApiProperty({ type: PriceRuleDto, required: false })
  @ValidateNested()
  @Type(() => PriceRuleDto)
  @IsOptional()
  priceThreshold?: PriceRuleDto

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  stockStatus?: boolean

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sizeAvailability?: string[]

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  customSelector?: string
}

export class CreateWatcherDto {
  @ApiProperty({ example: 'https://example.com/product/123' })
  @IsUrl()
  url: string

  @ApiProperty({ example: 'Nike Air Max 90' })
  @IsString()
  @MaxLength(200)
  name: string

  @ApiProperty({ type: WatcherRulesDto })
  @ValidateNested()
  @Type(() => WatcherRulesDto)
  rules: WatcherRulesDto

  @ApiProperty({ example: 300, description: 'Check interval in seconds' })
  @IsNumber()
  @Min(60)
  @Max(86400)
  interval: number
}

export class UpdateWatcherDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string

  @ApiProperty({ type: WatcherRulesDto, required: false })
  @ValidateNested()
  @Type(() => WatcherRulesDto)
  @IsOptional()
  rules?: WatcherRulesDto

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Min(60)
  @Max(86400)
  interval?: number

  @ApiProperty({ enum: ['active', 'paused'], required: false })
  @IsEnum(['active', 'paused'])
  @IsOptional()
  status?: 'active' | 'paused'
}

export class WatcherQueryDto {
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

  @ApiProperty({ enum: ['active', 'paused', 'error', 'disabled'], required: false })
  @IsEnum(['active', 'paused', 'error', 'disabled'])
  @IsOptional()
  status?: string
}
