import { Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'USER')
@ApiBearerAuth()
export class WishlistController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get url() {
    return this.configService.get<string>('ORDER_SERVICE_URL');
  }

  @Get()
  @ApiOperation({ summary: 'Get wishlist for current user' })
  async getWishlist(@Req() req: any) {
    const res = await firstValueFrom(
      this.httpService.get(`${this.url}/wishlist`, { headers: { 'x-user-id': req.user.sub } }),
    );
    return res.data;
  }

  @Post(':skuId')
  @ApiOperation({ summary: 'Add SKU to wishlist' })
  @ApiParam({ name: 'skuId', type: 'string' })
  async add(@Req() req: any, @Param('skuId') skuId: string) {
    const res = await firstValueFrom(
      this.httpService.post(`${this.url}/wishlist/${skuId}`, {}, { headers: { 'x-user-id': req.user.sub } }),
    );
    return res.data;
  }

  @Delete(':skuId')
  @ApiOperation({ summary: 'Remove SKU from wishlist' })
  @ApiParam({ name: 'skuId', type: 'string' })
  async remove(@Req() req: any, @Param('skuId') skuId: string) {
    const res = await firstValueFrom(
      this.httpService.delete(`${this.url}/wishlist/${skuId}`, { headers: { 'x-user-id': req.user.sub } }),
    );
    return res.data;
  }
}
