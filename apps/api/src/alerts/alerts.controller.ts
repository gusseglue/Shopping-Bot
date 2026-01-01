import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger'

import { AlertsService } from './alerts.service'
import { AlertQueryDto } from './dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@ApiTags('alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all alerts' })
  @ApiResponse({ status: 200, description: 'List of alerts' })
  async findAll(
    @Request() req: { user: { sub: string } },
    @Query() query: AlertQueryDto,
  ) {
    return this.alertsService.findAll(req.user.sub, query)
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread alert count' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  async getUnreadCount(@Request() req: { user: { sub: string } }) {
    return this.alertsService.getUnreadCount(req.user.sub)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an alert by ID' })
  @ApiResponse({ status: 200, description: 'Alert details' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async findById(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.alertsService.findById(req.user.sub, id)
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark an alert as read' })
  @ApiResponse({ status: 200, description: 'Alert marked as read' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async markAsRead(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.alertsService.markAsRead(req.user.sub, id)
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all alerts as read' })
  @ApiResponse({ status: 200, description: 'All alerts marked as read' })
  async markAllAsRead(@Request() req: { user: { sub: string } }) {
    return this.alertsService.markAllAsRead(req.user.sub)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an alert' })
  @ApiResponse({ status: 200, description: 'Alert deleted' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async delete(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.alertsService.delete(req.user.sub, id)
  }
}
