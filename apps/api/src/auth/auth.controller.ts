import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
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
import { WebAuthnService } from './webauthn.service'
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDeviceDto,
  AuthResponseDto,
  VerifyResponseDto,
  WebAuthnRegistrationStartDto,
  WebAuthnRegistrationFinishDto,
  WebAuthnAuthenticationStartDto,
  WebAuthnAuthenticationFinishDto,
  WebAuthnAddPasskeyFinishDto,
} from './dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly webAuthnService: WebAuthnService,
  ) {}

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

  // WebAuthn/Passkey Endpoints

  @Post('webauthn/register/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start passkey registration for a new user' })
  @ApiResponse({ status: 200, description: 'Registration options generated' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async webAuthnRegisterStart(@Body() dto: WebAuthnRegistrationStartDto) {
    return this.webAuthnService.startRegistration(dto)
  }

  @Post('webauthn/register/finish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete passkey registration for a new user' })
  @ApiResponse({ status: 200, description: 'Registration successful', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid credential' })
  async webAuthnRegisterFinish(@Body() dto: WebAuthnRegistrationFinishDto) {
    return this.webAuthnService.finishRegistration(dto)
  }

  @Post('webauthn/login/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start passkey authentication' })
  @ApiResponse({ status: 200, description: 'Authentication options generated' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or no passkeys registered' })
  async webAuthnLoginStart(@Body() dto: WebAuthnAuthenticationStartDto) {
    return this.webAuthnService.startAuthentication(dto)
  }

  @Post('webauthn/login/finish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete passkey authentication' })
  @ApiResponse({ status: 200, description: 'Authentication successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  async webAuthnLoginFinish(@Body() dto: WebAuthnAuthenticationFinishDto) {
    return this.webAuthnService.finishAuthentication(dto)
  }

  @Post('passkeys/add/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start adding a new passkey to existing account' })
  @ApiResponse({ status: 200, description: 'Registration options generated' })
  async addPasskeyStart(@Request() req: { user: { sub: string } }) {
    return this.webAuthnService.startAddPasskey(req.user.sub)
  }

  @Post('passkeys/add/finish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete adding a new passkey to existing account' })
  @ApiResponse({ status: 200, description: 'Passkey added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid credential' })
  async addPasskeyFinish(
    @Request() req: { user: { sub: string } },
    @Body() dto: WebAuthnAddPasskeyFinishDto,
  ) {
    return this.webAuthnService.finishAddPasskey(req.user.sub, dto)
  }

  @Get('passkeys')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user passkeys' })
  @ApiResponse({ status: 200, description: 'List of passkeys' })
  async getPasskeys(@Request() req: { user: { sub: string } }) {
    return this.webAuthnService.getPasskeys(req.user.sub)
  }

  @Patch('passkeys/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rename a passkey' })
  @ApiResponse({ status: 200, description: 'Passkey renamed' })
  @ApiResponse({ status: 404, description: 'Passkey not found' })
  async renamePasskey(
    @Request() req: { user: { sub: string } },
    @Param('id') passkeyId: string,
    @Body('name') name: string,
  ) {
    return this.webAuthnService.renamePasskey(req.user.sub, passkeyId, name)
  }

  @Delete('passkeys/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a passkey' })
  @ApiResponse({ status: 200, description: 'Passkey deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete last passkey without password' })
  @ApiResponse({ status: 404, description: 'Passkey not found' })
  async deletePasskey(
    @Request() req: { user: { sub: string } },
    @Param('id') passkeyId: string,
  ) {
    return this.webAuthnService.deletePasskey(req.user.sub, passkeyId)
  }
}
