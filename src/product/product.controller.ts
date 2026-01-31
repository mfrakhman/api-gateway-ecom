import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ApiTags } from '@nestjs/swagger';

@Controller('products')
export class ProductController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // Products
  @Get()
  async getAllProducts() {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    const res = await firstValueFrom(this.httpService.get(`${url}/products`));
    return res.data;
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.get(`${url}/products/${id}`),
    );
    return res.data;
  }

  @Post()
  async createProduct(@Body() body: any) {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${url}/products`, body),
    );
    return res.data;
  }

  @Patch(':id')
  async updateProduct(@Param('id') id: string, @Body() body: any) {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.patch(`${url}/products/${id}`, body),
    );
    return res.data;
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.delete(`${url}/products/${id}`),
    );
    return res.data;
  }

  @ApiTags('SKUs')
  @Get(':id/skus')
  async getSKUsByProductId(@Param('id') id: string) {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.get(`${url}/products/${id}/skus`),
    );
    return res.data;
  }

  @ApiTags('SKUs')
  @Post('/skus')
  async createSKU(@Body() body: any) {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${url}/skus`, body),
    );
    return res.data;
  }

  @ApiTags('SKUs')
  @Get('/skus/:id')
  async getDetailedSKU(@Param('id') id: string) {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    console.log(url);

    const res = await firstValueFrom(this.httpService.get(`${url}/skus/${id}`));
    return res.data;
  }

  @ApiTags('SKUs')
  @Post('/skus/:id/restock')
  async reStockSKU(@Param('id') id: string, @Body() body: any) {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    console.log(url);
    const res = await firstValueFrom(
      this.httpService.post(`${url}/skus/${id}/restock`, body),
    );
    return res.data;
  }

  @ApiTags('SKUs')
  @Patch()
  async updateSKU() {}
}
