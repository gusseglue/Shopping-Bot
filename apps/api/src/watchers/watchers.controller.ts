import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
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

import { WatchersService } from './watchers.service'
import { CreateWatcherDto, UpdateWatcherDto, WatcherQueryDto } from './dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@ApiTags('watchers')
@Controller('watchers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WatchersController {
  constructor(private readonly watchersService: WatchersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new watcher' })
  @ApiResponse({ status: 201, description: 'Watcher created' })
  @ApiResponse({ status: 400, description: 'Invalid URL or domain not allowed' })
  @ApiResponse({ status: 403, description: 'Watcher limit reached' })
  async create(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreateWatcherDto,
  ) {
    return this.watchersService.create(req.user.sub, dto)
  }

  @Get()
  @ApiOperation({ summary: 'Get all watchers' })
  @ApiResponse({ status: 200, description: 'List of watchers' })
  async findAll(
    @Request() req: { user: { sub: string } },
    @Query() query: WatcherQueryDto,
  ) {
    return this.watchersService.findAll(req.user.sub, query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a watcher by ID' })
  @ApiResponse({ status: 200, description: 'Watcher details' })
  @ApiResponse({ status: 404, description: 'Watcher not found' })
  async findById(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.watchersService.findById(req.user.sub, id)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a watcher' })
  @ApiResponse({ status: 200, description: 'Watcher updated' })
  @ApiResponse({ status: 404, description: 'Watcher not found' })
  async update(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: UpdateWatcherDto,
  ) {
    return this.watchersService.update(req.user.sub, id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a watcher' })
  @ApiResponse({ status: 200, description: 'Watcher deleted' })
  @ApiResponse({ status: 404, description: 'Watcher not found' })
  async delete(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.watchersService.delete(req.user.sub, id)
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a watcher' })
  @ApiResponse({ status: 200, description: 'Watcher paused' })
  @ApiResponse({ status: 404, description: 'Watcher not found' })
  async pause(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.watchersService.pause(req.user.sub, id)
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume a watcher' })
  @ApiResponse({ status: 200, description: 'Watcher resumed' })
  @ApiResponse({ status: 404, description: 'Watcher not found' })
  async resume(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.watchersService.resume(req.user.sub, id)
  }
}
