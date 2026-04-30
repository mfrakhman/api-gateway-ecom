import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import FormData from 'form-data';
import type { Multer } from 'multer';

const ProductSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    slug: { type: 'string' },
    description: { type: 'string', nullable: true },
    categoryId: { type: 'string', format: 'uuid' },
    sizeGroup: { type: 'string', nullable: true },
    isActive: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const SkuSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    skuCode: { type: 'string' },
    colorId: { type: 'string', format: 'uuid' },
    sizeId: { type: 'string', format: 'uuid', nullable: true },
    price: { type: 'integer', description: 'Price in IDR' },
    compareAt: { type: 'integer', nullable: true, description: 'Original price in IDR' },
    isActive: { type: 'boolean' },
    stock: {
      type: 'object',
      properties: {
        amount: { type: 'integer' },
        reserved: { type: 'integer' },
      },
    },
  },
};

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get productUrl() {
    return this.configService.get<string>('PRODUCT_SERVICE_URL');
  }

  // ── Products ────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'query', required: false })
  async getAllProducts(@Query() query: any) {
    const res = await firstValueFrom(
      this.httpService.get(`${this.productUrl}/products`, { params: query }),
    );
    return res.data;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async getProductById(@Param('id') id: string) {
    const res = await firstValueFrom(
      this.httpService.get(`${this.productUrl}/products/${id}`),
    );
    return res.data;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'slug', 'categoryId', 'skus'],
      properties: {
        name: { type: 'string' },
        slug: { type: 'string' },
        description: { type: 'string' },
        categoryId: { type: 'string', format: 'uuid' },
        sizeGroup: { type: 'string', description: 'apparel | footwear_uk | waist — omit for bags' },
        skus: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['skuCode', 'colorId', 'price', 'isActive', 'quantity'],
            properties: {
              skuCode: { type: 'string' },
              colorId: { type: 'string', format: 'uuid' },
              sizeId: { type: 'string', format: 'uuid' },
              price: { type: 'integer', description: 'Price in IDR' },
              compareAt: { type: 'integer', description: 'Original price in IDR' },
              isActive: { type: 'boolean', default: true },
              quantity: { type: 'integer', minimum: 1 },
            },
          },
        },
      },
    },
  })
  async createProduct(@Body() body: any) {
    const res = await firstValueFrom(
      this.httpService.post(`${this.productUrl}/products`, body),
    );
    return res.data;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        slug: { type: 'string' },
        description: { type: 'string' },
        categoryId: { type: 'string', format: 'uuid' },
        sizeGroup: { type: 'string' },
      },
    },
  })
  async updateProduct(@Param('id') id: string, @Body() body: any) {
    const res = await firstValueFrom(
      this.httpService.patch(`${this.productUrl}/products/${id}`, body),
    );
    return res.data;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async deleteProduct(@Param('id') id: string) {
    const res = await firstValueFrom(
      this.httpService.delete(`${this.productUrl}/products/${id}`),
    );
    return res.data;
  }

  // ── Product color images ─────────────────────────────────────────

  @Get(':productId/colors/:colorId/images')
  @ApiOperation({ summary: 'Get images for a product colorway' })
  async getColorImages(
    @Param('productId') productId: string,
    @Param('colorId') colorId: string,
  ) {
    const res = await firstValueFrom(
      this.httpService.get(
        `${this.productUrl}/products/${productId}/colors/${colorId}/images`,
      ),
    );
    return res.data;
  }

  @Post(':productId/colors/:colorId/images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload image for a product colorway' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        altText: { type: 'string' },
      },
    },
  })
  async uploadColorImage(
    @Param('productId') productId: string,
    @Param('colorId') colorId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('altText') altText?: string,
  ) {
    const form = new FormData();
    form.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    if (altText) form.append('altText', altText);
    const res = await firstValueFrom(
      this.httpService.post(
        `${this.productUrl}/products/${productId}/colors/${colorId}/images`,
        form,
        { headers: form.getHeaders() },
      ),
    );
    return res.data;
  }

  @Delete(':productId/colors/:colorId/images/:imageId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product colorway image' })
  async deleteColorImage(
    @Param('productId') productId: string,
    @Param('colorId') colorId: string,
    @Param('imageId') imageId: string,
  ) {
    const res = await firstValueFrom(
      this.httpService.delete(
        `${this.productUrl}/products/${productId}/colors/${colorId}/images/${imageId}`,
      ),
    );
    return res.data;
  }

  // ── SKUs ─────────────────────────────────────────────────────────

  @ApiTags('SKUs')
  @Get(':id/skus')
  @ApiOperation({ summary: 'Get SKUs by product ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async getSKUsByProductId(@Param('id') id: string) {
    const res = await firstValueFrom(
      this.httpService.get(`${this.productUrl}/products/${id}/skus`),
    );
    return res.data;
  }

  @ApiTags('SKUs')
  @Post('/skus')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a SKU' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['skuCode', 'colorId', 'price', 'isActive', 'product_id', 'quantity'],
      properties: {
        skuCode: { type: 'string' },
        colorId: { type: 'string', format: 'uuid' },
        sizeId: { type: 'string', format: 'uuid' },
        price: { type: 'integer', description: 'Price in IDR' },
        compareAt: { type: 'integer', description: 'Original price in IDR' },
        isActive: { type: 'boolean' },
        product_id: { type: 'string', format: 'uuid' },
        quantity: { type: 'integer', minimum: 1 },
      },
    },
  })
  async createSKU(@Body() body: any) {
    const res = await firstValueFrom(
      this.httpService.post(`${this.productUrl}/skus`, body),
    );
    return res.data;
  }

  @ApiTags('SKUs')
  @Get('/skus/:id')
  @ApiOperation({ summary: 'Get SKU by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async getDetailedSKU(@Param('id') id: string) {
    const res = await firstValueFrom(
      this.httpService.get(`${this.productUrl}/skus/${id}`),
    );
    return res.data;
  }

  @ApiTags('SKUs')
  @Post('/skus/validate')
  @ApiOperation({ summary: 'Validate SKU IDs and return prices' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['skuIds'],
      properties: {
        skuIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
      },
    },
  })
  async validateSkus(@Body() body: { skuIds: string[] }) {
    const res = await firstValueFrom(
      this.httpService.post(`${this.productUrl}/skus/validate`, body),
    );
    return res.data;
  }

  @ApiTags('SKUs')
  @Patch('/skus/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a SKU' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        skuCode:   { type: 'string' },
        colorId:   { type: 'string', format: 'uuid' },
        sizeId:    { type: 'string', format: 'uuid', nullable: true },
        price:     { type: 'integer', minimum: 0 },
        compareAt: { type: 'integer', minimum: 0, nullable: true },
        isActive:  { type: 'boolean' },
      },
    },
  })
  async updateSKU(@Param('id') id: string, @Body() body: any) {
    const res = await firstValueFrom(
      this.httpService.patch(`${this.productUrl}/skus/${id}`, body),
    );
    return res.data;
  }

  @ApiTags('SKUs')
  @Post('/skus/:id/restock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restock a SKU' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['quantity'],
      properties: { quantity: { type: 'integer', minimum: 1 } },
    },
  })
  async reStockSKU(@Param('id') id: string, @Body() body: any) {
    const res = await firstValueFrom(
      this.httpService.post(`${this.productUrl}/skus/${id}/restock`, body),
    );
    return res.data;
  }
}
