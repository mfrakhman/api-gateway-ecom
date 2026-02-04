import { HttpService } from '@nestjs/axios';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('order')
export class OrderController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  async createOrder(@Body() body: any) {
    const url = this.configService.get<string>('ORDER_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${url}/orders`, body),
    );
    return res.data;
  }
}
