import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
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
    const items = Array.isArray(body?.items) ? body.items : [];
    if (items.length === 0) {
      throw new BadRequestException('items must be a non-empty array');
    }

    const skuIds = items
      .map((item: { skuId?: string }) => item?.skuId)
      .filter((skuId: string | undefined): skuId is string => !!skuId);

    if (skuIds.length !== items.length) {
      throw new BadRequestException('each item must include skuId');
    }

    const productUrl = this.configService.get<string>('PRODUCT_SERVICE_URL');
    if (!productUrl) {
      throw new BadRequestException('PRODUCT_SERVICE_URL not configured');
    }

    const validateRes = await firstValueFrom(
      this.httpService.post(`${productUrl}/skus/validate`, { skuIds }),
    );

    if (
      Array.isArray(validateRes.data?.invalid) &&
      validateRes.data.invalid.length > 0
    ) {
      throw new BadRequestException({
        message: 'invalid skuIds',
        invalid: validateRes.data.invalid,
      });
    }

    const url = this.configService.get<string>('ORDER_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${url}/orders`, body),
    );
    return res.data;
  }
}
