import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger'

import { WebhooksService } from './webhooks.service'
import { CreateWebhookDto, UpdateWebhookDto, TestWebhookDto } from './dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@ApiTags('webhooks')
@Controller('webhooks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all webhook configurations' })
  @ApiResponse({ status: 200, description: 'List of webhooks' })
  async findAll(@Request() req: { user: { sub: string } }) {
    return this.webhooksService.findAll(req.user.sub)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a webhook by ID' })
  @ApiResponse({ status: 200, description: 'Webhook details' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async findById(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.webhooksService.findById(req.user.sub, id)
  }

  @Post()
  @ApiOperation({ summary: 'Create a new webhook' })
  @ApiResponse({ status: 201, description: 'Webhook created' })
  @ApiResponse({ status: 400, description: 'Invalid webhook URL or already exists' })
  async create(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreateWebhookDto,
  ) {
    return this.webhooksService.create(req.user.sub, dto)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a webhook' })
  @ApiResponse({ status: 200, description: 'Webhook updated' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async update(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.webhooksService.update(req.user.sub, id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a webhook' })
  @ApiResponse({ status: 200, description: 'Webhook deleted' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async delete(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.webhooksService.delete(req.user.sub, id)
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Send a test webhook' })
  @ApiResponse({ status: 200, description: 'Test sent successfully' })
  @ApiResponse({ status: 400, description: 'Failed to send test' })
  @ApiResponse({ status: 404, description: 'Webhook not found' })
  async test(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: TestWebhookDto,
  ) {
    return this.webhooksService.test(req.user.sub, id, dto.message)
  }
}
