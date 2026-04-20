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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

const OrderItemSchema = {
  type: 'object',
  properties: {
    skuId: { type: 'string', format: 'uuid' },
    quantity: { type: 'integer', minimum: 1 },
    price: { type: 'number' },
  },
};

const OrderSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] },
    totalAmount: { type: 'number' },
    items: { type: 'array', items: OrderItemSchema },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

@ApiTags('Orders')
@Controller('order')
export class OrderController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all orders (admin only)' })
  @ApiResponse({ status: 200, schema: { type: 'array', items: OrderSchema } })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get orders for the current authenticated user' })
  @ApiResponse({ status: 200, schema: { type: 'array', items: OrderSchema } })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, schema: OrderSchema })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['items'],
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            required: ['skuId', 'quantity'],
            properties: {
              skuId: { type: 'string', format: 'uuid' },
              quantity: { type: 'integer', minimum: 1 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, schema: OrderSchema })
  @ApiResponse({ status: 400, description: 'Invalid SKU IDs or missing items' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
        (s) => [s.id, parseFloat(s.price as any)],
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
