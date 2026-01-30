import { HttpService } from '@nestjs/axios';
import { Body, Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Controller('order')
export class OrderController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async createOrder(@Body() body: any) {
    const url = this.configService.get<string>('ORDER_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${url}/order`, body),
    );
    return res.data;
  }
}
