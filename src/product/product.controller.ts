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

  //SKUs
  @Post('/skus')
  async createSKU(@Body() body: any) {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${url}/skus`, body),
    );
    return res.data;
  }

  @Get('/skus')
  async getAllSKUs() {
    const url = this.configService.get<string>('PRODUCT_SERVICE_URL');
    const res = await firstValueFrom(this.httpService.get(`${url}/skus`));
    return res.data;
  }

  
}
