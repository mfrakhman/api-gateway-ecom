import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
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

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getOrders(@Req() req: any) {
    const url = this.configService.get<string>('ORDER_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.get(`${url}/orders`, {
        headers: { 'x-user-id': req.user.sub },
      }),
    );
    return res.data;
  }

  @Get('user/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  async getMyOrders(@Req() req: any) {
    const url = this.configService.get<string>('ORDER_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.get(`${url}/orders/user/me`, {
        headers: { 'x-user-id': req.user.sub },
      }),
    );
    return res.data;
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  async getOrder(@Param('id') id: string, @Req() req: any) {
    const url = this.configService.get<string>('ORDER_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.get(`${url}/orders/${id}`, {
        headers: { 'x-user-id': req.user.sub },
      }),
    );
    return res.data;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  async createOrder(@Body() body: any, @Req() req: any) {
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

    const priceMap = new Map<string, number>(
      (validateRes.data.valid as { id: string; price: number }[]).map(
        (s) => [s.id, s.price],
      ),
    );

    const itemsWithPrice = items.map((item: { skuId: string; quantity: number }) => ({
      ...item,
      price: priceMap.get(item.skuId),
    }));

    const url = this.configService.get<string>('ORDER_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${url}/orders`, { ...body, items: itemsWithPrice }, {
        headers: { 'x-user-id': req.user.sub },
      }),
    );
    return res.data;
  }
}
