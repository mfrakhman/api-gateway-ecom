import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';

const UserSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string' },
    role: { type: 'string', enum: ['ADMIN', 'USER'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Login and get access token' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        password: { type: 'string', example: 'password123' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        user: UserSchema,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() body: any) {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${authServiceUrl}/auth/login`, body),
    );
    return res.data;
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password', 'name'],
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        password: { type: 'string', example: 'password123' },
        name: { type: 'string', example: 'John Doe' },
      },
    },
  })
  @ApiResponse({ status: 201, schema: UserSchema })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async register(@Body() body: any) {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${authServiceUrl}/auth/register`, body),
    );
    return res.data;
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() body: any) {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${authServiceUrl}/auth/refresh`, body),
    );
    return res.data;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, schema: UserSchema })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@Req() req: any) {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.get(`${authServiceUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${req.headers['authorization']?.split(' ')[1]}` },
      }),
    );
    return res.data;
  }

  @Get('ping')
  @ApiOperation({ summary: 'Health check for auth service' })
  @ApiResponse({ status: 200, schema: { type: 'string' } })
  async ping() {
    return 'Auth Service is up and running!';
  }
}
