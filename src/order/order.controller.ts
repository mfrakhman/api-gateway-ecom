import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
    price: { type: 'number', nullable: true },
  },
};

const OrderSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    status: { type: 'string', enum: ['CART', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'COMPLETED'] },
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
  async getOrders(@Req() req: any) {
    const url = this.configService.get<string>('ORDER_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.get(`${url}/orders`, { headers: { 'x-user-id': req.user.sub } }),
    );
    return res.data;
  }

  @Get('user/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get orders for the current authenticated user' })
  @ApiResponse({ status: 200, schema: { type: 'array', items: OrderSchema } })
  async getMyOrders(@Req() req: any) {
    const url = this.configService.get<string>('ORDER_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.get(`${url}/orders/user/me`, { headers: { 'x-user-id': req.user.sub } }),
    );
    return res.data;
  }

  @Get('cart')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user cart' })
  @ApiResponse({ status: 200, schema: OrderSchema })
  async getCart(@Req() req: any) {
    const url = this.configService.get<string>('ORDER_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.get(`${url}/orders/cart`, { headers: { 'x-user-id': req.user.sub } }),
    );
    return res.data;
  }

  @Delete('cart')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear current user cart' })
  async clearCart(@Req() req: any) {
    const url = this.configService.get<string>('ORDER_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.delete(`${url}/orders/cart`, { headers: { 'x-user-id': req.user.sub } }),
    );
    return res.data;
  }

  @Post('cart/items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['skuId', 'quantity'],
      properties: {
        skuId: { type: 'string', format: 'uuid' },
        quantity: { type: 'integer', minimum: 1 },
      },
    },
  })
  @ApiResponse({ status: 201, schema: OrderSchema })
  async addCartItem(@Req() req: any, @Body() body: any) {
    const url = this.configService.get<string>('ORDER_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${url}/orders/cart/items`, body, { headers: { 'x-user-id': req.user.sub } }),
    );
    return res.data;
  }

  @Patch('cart/items/:skuId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiParam({ name: 'skuId', type: 'string', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['quantity'],
      properties: { quantity: { type: 'integer', minimum: 0 } },
    },
  })
  async updateCartItem(@Req() req: any, @Param('skuId') skuId: string, @Body() body: any) {
    const url = this.configService.get<string>('ORDER_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.patch(`${url}/orders/cart/items/${skuId}`, body, { headers: { 'x-user-id': req.user.sub } }),
    );
    return res.data;
  }

  @Delete('cart/items/:skuId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiParam({ name: 'skuId', type: 'string', format: 'uuid' })
  async removeCartItem(@Req() req: any, @Param('skuId') skuId: string) {
    const url = this.configService.get<string>('ORDER_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.delete(`${url}/orders/cart/items/${skuId}`, { headers: { 'x-user-id': req.user.sub } }),
    );
    return res.data;
  }

  @Post('cart/checkout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Checkout cart — validates SKUs and locks prices' })
  @ApiResponse({ status: 201, schema: OrderSchema })
  @ApiResponse({ status: 400, description: 'Cart empty or invalid SKUs' })
  async checkoutCart(@Req() req: any) {
    const orderUrl = this.configService.get<string>('ORDER_SERVICE_URL');
    const productUrl = this.configService.get<string>('PRODUCT_SERVICE_URL');

    const cartRes = await firstValueFrom(
      this.httpService.get(`${orderUrl}/orders/cart`, { headers: { 'x-user-id': req.user.sub } }),
    );
    const cart = cartRes.data;

    if (!cart.items?.length) throw new BadRequestException('Cart is empty');

    const skuIds = cart.items.map((i: any) => i.skuId);
    const validateRes = await firstValueFrom(
      this.httpService.post(`${productUrl}/skus/validate`, { skuIds }),
    );

    if (validateRes.data?.invalid?.length > 0) {
      throw new BadRequestException({ message: 'Some SKUs are no longer available', invalid: validateRes.data.invalid });
    }

    const prices: Record<string, number> = Object.fromEntries(
      (validateRes.data.valid as { id: string; price: number }[]).map(
        s => [s.id, parseFloat(s.price as any)],
      ),
    );

    const res = await firstValueFrom(
      this.httpService.post(`${orderUrl}/orders/cart/checkout`, { prices }, { headers: { 'x-user-id': req.user.sub } }),
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
  async getOrder(@Param('id') id: string, @Req() req: any) {
    const url = this.configService.get<string>('ORDER_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.get(`${url}/orders/${id}`, { headers: { 'x-user-id': req.user.sub } }),
    );
    return res.data;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new order directly (bypasses cart)' })
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
  async createOrder(@Body() body: any, @Req() req: any) {
    const items = Array.isArray(body?.items) ? body.items : [];
    if (items.length === 0) throw new BadRequestException('items must be a non-empty array');

    const skuIds = items
      .map((item: { skuId?: string }) => item?.skuId)
      .filter((skuId: string | undefined): skuId is string => !!skuId);

    if (skuIds.length !== items.length) throw new BadRequestException('each item must include skuId');

    const productUrl = this.configService.get<string>('PRODUCT_SERVICE_URL');
    if (!productUrl) throw new BadRequestException('PRODUCT_SERVICE_URL not configured');

    const validateRes = await firstValueFrom(
      this.httpService.post(`${productUrl}/skus/validate`, { skuIds }),
    );

    if (Array.isArray(validateRes.data?.invalid) && validateRes.data.invalid.length > 0) {
      throw new BadRequestException({ message: 'invalid skuIds', invalid: validateRes.data.invalid });
    }

    const priceMap = new Map<string, number>(
      (validateRes.data.valid as { id: string; price: number }[]).map(
        s => [s.id, parseFloat(s.price as any)],
      ),
    );

    const itemsWithPrice = items.map((item: { skuId: string; quantity: number }) => ({
      ...item,
      price: priceMap.get(item.skuId),
    }));

    const url = this.configService.get<string>('ORDER_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${url}/orders`, { ...body, items: itemsWithPrice }, { headers: { 'x-user-id': req.user.sub } }),
    );
    return res.data;
  }
}
