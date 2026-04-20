import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProductModule } from './product/product.module';
import { AuthModule } from './auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { OrderModule } from './order/order.module';
import { UpstreamModule } from './upstream/upstream.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    ProductModule,
    AuthModule,
    OrderModule,
    UpstreamModule,
    StorageModule,
  ],
})
export class AppModule {}
