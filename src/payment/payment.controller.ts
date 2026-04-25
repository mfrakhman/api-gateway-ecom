import { HttpService } from '@nestjs/axios';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Payments')
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'USER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment details for an order' })
  @ApiParam({ name: 'orderId', type: 'string', format: 'uuid' })
  async getByOrderId(@Param('orderId') orderId: string, @Req() req: any) {
    const url = this.configService.get<string>('PAYMENT_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.get(`${url}/api/v1/payments/order/${orderId}`, {
        headers: { 'x-user-id': req.user.sub },
      }),
    );
    return res.data;
  }

  @Post('webhook/qris')
  @HttpCode(200)
  @ApiOperation({ summary: 'QRIS payment webhook — called by payment provider' })
  async handleWebhook(@Body() payload: any) {
    const url = this.configService.get<string>('PAYMENT_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.post(`${url}/api/v1/payments/webhook/qris`, payload),
    );
    return res.data;
  }
}
