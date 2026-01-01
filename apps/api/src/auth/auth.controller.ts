import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger'

import { AuthService } from './auth.service'
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDeviceDto,
  AuthResponseDto,
  VerifyResponseDto,
} from './dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto)
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Request() req: { user: { sub: string } },
    @Body('refreshToken') refreshToken?: string,
  ) {
    return this.authService.logout(req.user.sub, refreshToken)
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify access token and get user info' })
  @ApiResponse({ status: 200, description: 'Token is valid', type: VerifyResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async verify(@Request() req: { user: { sub: string } }) {
    return this.authService.verify(req.user.sub)
  }

  @Post('devices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new device' })
  @ApiResponse({ status: 201, description: 'Device registered' })
  async registerDevice(
    @Request() req: { user: { sub: string } },
    @Body() dto: RegisterDeviceDto,
  ) {
    return this.authService.registerDevice(req.user.sub, dto)
  }

  @Get('devices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user devices' })
  @ApiResponse({ status: 200, description: 'List of devices' })
  async getDevices(@Request() req: { user: { sub: string } }) {
    return this.authService.getUserDevices(req.user.sub)
  }

  @Delete('devices/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a device' })
  @ApiResponse({ status: 200, description: 'Device revoked' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  async revokeDevice(
    @Request() req: { user: { sub: string } },
    @Param('id') deviceId: string,
  ) {
    return this.authService.revokeDevice(req.user.sub, deviceId)
  }
}
