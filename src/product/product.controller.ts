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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateSKU() {}
}
