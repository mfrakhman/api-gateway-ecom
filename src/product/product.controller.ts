import { Controller, Get, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles('ADMIN')
  @Get('admin-only')
  findOnlyAdmin() {
    return 'This route is restricted to admin users only.';
  }

  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles('MERCHANT', 'ADMIN')
  @Get('merchant-only')
  findOnlyMerchant() {
    return 'This route is restricted to merchant users only.';
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    return this.productService.getAllProducts();
  }
}
