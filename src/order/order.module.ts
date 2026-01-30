import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [OrderController],
})
export class OrderModule {}
