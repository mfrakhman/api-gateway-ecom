import {
  Body, Controller, Delete, Get, Patch, Post,
  Req, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import FormData from 'form-data';
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

  @Post('verify-email/send')
  @ApiOperation({ summary: 'Send email verification OTP' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: { email: { type: 'string', format: 'email' } },
    },
  })
  async sendVerificationOtp(@Body() body: any) {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${authServiceUrl}/auth/verify-email/send`, body),
    );
    return res.data;
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with OTP code' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'code'],
      properties: {
        email: { type: 'string', format: 'email' },
        code:  { type: 'string', example: '123456' },
      },
    },
  })
  async verifyEmail(@Body() body: any) {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${authServiceUrl}/auth/verify-email`, body),
    );
    return res.data;
  }

  @Post('login/otp/send')
  @ApiOperation({ summary: 'Send OTP code for login' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: { email: { type: 'string', format: 'email' } },
    },
  })
  async sendLoginOtp(@Body() body: any) {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${authServiceUrl}/auth/login/otp/send`, body),
    );
    return res.data;
  }

  @Post('login/otp')
  @ApiOperation({ summary: 'Verify OTP and login' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'code'],
      properties: {
        email: { type: 'string', format: 'email' },
        code:  { type: 'string', example: '123456' },
      },
    },
  })
  async verifyLoginOtp(@Body() body: any) {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${authServiceUrl}/auth/login/otp`, body),
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

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName:  { type: 'string' },
        lastName:   { type: 'string' },
        dob:        { type: 'string', format: 'date', example: '1995-08-20' },
        gender:     { type: 'string', enum: ['MALE', 'FEMALE'] },
        phone:      { type: 'string', example: '+628123456789' },
        address: {
          type: 'object',
          properties: {
            street:     { type: 'string' },
            city:       { type: 'string' },
            province:   { type: 'string' },
            postalCode: { type: 'string' },
            country:    { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 200, schema: UserSchema })
  async updateMe(@Req() req: any, @Body() body: any) {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.patch(`${authServiceUrl}/auth/me`, body, {
        headers: { Authorization: req.headers['authorization'] },
      }),
    );
    return res.data;
  }

  @Post('me/photo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload profile photo' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 3 * 1024 * 1024 } }))
  @ApiResponse({ status: 200, schema: UserSchema })
  async uploadPhoto(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
    const form = new FormData();
    form.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype });
    const res = await firstValueFrom(
      this.httpService.post(`${authServiceUrl}/auth/me/photo`, form, {
        headers: { ...form.getHeaders(), Authorization: req.headers['authorization'] },
      }),
    );
    return res.data;
  }

  @Delete('me/photo')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove profile photo' })
  @ApiResponse({ status: 200, schema: UserSchema })
  async deletePhoto(@Req() req: any) {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.delete(`${authServiceUrl}/auth/me/photo`, {
        headers: { Authorization: req.headers['authorization'] },
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
