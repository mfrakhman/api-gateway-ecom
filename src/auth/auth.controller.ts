import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  async login(@Body() body: any) {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${authServiceUrl}/auth/login`, body),
    );
    return res.data;
  }

  @Post('register')
  async register(@Body() body: any) {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${authServiceUrl}/auth/register`, body),
    );
    return res.data;
  }

  @Post('refresh')
  async refresh(@Body() body: any) {
    const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${authServiceUrl}/auth/refresh`, body),
    );
    return res.data;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
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
  async ping() {
    return 'Auth Service is up and running!';
  }
}
