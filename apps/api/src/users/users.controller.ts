import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger'

import { UsersService } from './users.service'
import { UpdateUserDto } from './dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  async getProfile(@Request() req: { user: { sub: string } }) {
    return this.usersService.getProfile(req.user.sub)
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Updated user profile' })
  async updateProfile(
    @Request() req: { user: { sub: string } },
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user.sub, dto)
  }

  // Admin endpoints
  @Get()
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of users' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async getAllUsers(
    @Request() req: { user: { sub: string; role: string } },
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required')
    }
    return this.usersService.findAll(page, limit)
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics (admin only)' })
  @ApiResponse({ status: 200, description: 'User statistics' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async getStats(@Request() req: { user: { sub: string; role: string } }) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required')
    }
    return this.usersService.getStats()
  }
}
