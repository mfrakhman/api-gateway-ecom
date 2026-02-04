import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [OrderController],
})
export class OrderModule {}
