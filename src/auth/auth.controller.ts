import { Body, Controller, Post } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

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
}
