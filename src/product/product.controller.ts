import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
    description: { type: 'string', nullable: true },
    category: { type: 'string', enum: ['BAGS', 'SHOES', 'CLOTHES', 'PANTS'] },
    imageUrl: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

const SkuSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    skuCode: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
    size: { type: 'string', nullable: true },
    color: { type: 'string', nullable: true },
    price: { type: 'number' },
    isActive: { type: 'boolean' },
    imageUrl: { type: 'string', nullable: true },
    stock: {
      type: 'object',
      properties: {
        amount: { type: 'number' },
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

  // Products
  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, schema: { type: 'array', items: ProductSchema } })
  async getAllProducts() {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    const res = await firstValueFrom(this.httpService.get(`${url}/products`));
    return res.data;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, schema: { ...ProductSchema, properties: { ...ProductSchema.properties, skus: { type: 'array', items: SkuSchema } } } })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductById(@Param('id') id: string) {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.get(`${url}/products/${id}`),
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
      required: ['name', 'description', 'category', 'skus'],
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string', enum: ['BAGS', 'SHOES', 'CLOTHES', 'PANTS'] },
        skus: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['skuCode', 'name', 'description', 'size', 'color', 'price', 'isActive', 'quantity'],
            properties: {
              skuCode: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              size: { type: 'string' },
              color: { type: 'string' },
              price: { type: 'number' },
              isActive: { type: 'boolean', default: true },
              quantity: { type: 'integer', minimum: 1 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, schema: ProductSchema })
  async createProduct(@Body() body: any) {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${url}/products`, body),
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
        description: { type: 'string' },
        category: { type: 'string', enum: ['BAGS', 'SHOES', 'CLOTHES', 'PANTS'] },
      },
    },
  })
  @ApiResponse({ status: 200, schema: ProductSchema })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateProduct(@Param('id') id: string, @Body() body: any) {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.patch(`${url}/products/${id}`, body),
    );
    return res.data;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async deleteProduct(@Param('id') id: string) {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.delete(`${url}/products/${id}`),
    );
    return res.data;
  }

  @ApiTags('SKUs')
  @Get(':id/skus')
  @ApiOperation({ summary: 'Get SKUs by product ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, schema: { type: 'array', items: SkuSchema } })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getSKUsByProductId(@Param('id') id: string) {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.get(`${url}/products/${id}/skus`),
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
      required: ['name', 'description', 'skuCode', 'size', 'color', 'price', 'isActive', 'product_id', 'quantity'],
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        skuCode: { type: 'string' },
        size: { type: 'string' },
        color: { type: 'string' },
        price: { type: 'number' },
        isActive: { type: 'boolean' },
        product_id: { type: 'string', format: 'uuid' },
        quantity: { type: 'integer', minimum: 0 },
      },
    },
  })
  @ApiResponse({ status: 201, schema: SkuSchema })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async createSKU(@Body() body: any) {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${url}/skus`, body),
    );
    return res.data;
  }

  @ApiTags('SKUs')
  @Get('/skus/:id')
  @ApiOperation({ summary: 'Get SKU by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, schema: SkuSchema })
  @ApiResponse({ status: 404, description: 'SKU not found' })
  async getDetailedSKU(@Param('id') id: string) {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    const res = await firstValueFrom(this.httpService.get(`${url}/skus/${id}`));
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
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        valid: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              price: { type: 'number' },
            },
          },
        },
        invalid: { type: 'array', items: { type: 'string', format: 'uuid' } },
      },
    },
  })
  async validateSkus(@Body() body: { skuIds: string[] }) {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${url}/skus/validate`, body),
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
      properties: {
        quantity: { type: 'integer', minimum: 1 },
      },
    },
  })
  @ApiResponse({ status: 200, schema: { type: 'object', properties: { message: { type: 'string' } } } })
  @ApiResponse({ status: 404, description: 'SKU not found' })
  async reStockSKU(@Param('id') id: string, @Body() body: any) {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${url}/skus/${id}/restock`, body),
    );
    return res.data;
  }

  // Product image
  @Post(':id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload product image' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiResponse({ status: 201, schema: { type: 'object', properties: { imageUrl: { type: 'string' } } } })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async uploadProductImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    const form = new FormData();
    form.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype });
    const res = await firstValueFrom(
      this.httpService.post(`${url}/products/${id}/image`, form, {
        headers: form.getHeaders(),
      }),
    );
    return res.data;
  }

  @Delete(':id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product image' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Image deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async deleteProductImage(@Param('id') id: string) {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.delete(`${url}/products/${id}/image`),
    );
    return res.data;
  }

  // SKU image
  @ApiTags('SKUs')
  @Post('/skus/:id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload SKU image' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiResponse({ status: 201, schema: { type: 'object', properties: { imageUrl: { type: 'string' } } } })
  @ApiResponse({ status: 404, description: 'SKU not found' })
  async uploadSkuImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    const form = new FormData();
    form.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype });
    const res = await firstValueFrom(
      this.httpService.post(`${url}/skus/${id}/image`, form, {
        headers: form.getHeaders(),
      }),
    );
    return res.data;
  }

  @ApiTags('SKUs')
  @Delete('/skus/:id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete SKU image' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Image deleted' })
  @ApiResponse({ status: 404, description: 'SKU not found' })
  async deleteSkuImage(@Param('id') id: string) {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.delete(`${url}/skus/${id}/image`),
    );
    return res.data;
  }
}
