import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [PaymentController],
})
export class PaymentModule {}
