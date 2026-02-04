import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [ProductController],
})
export class ProductModule {}
