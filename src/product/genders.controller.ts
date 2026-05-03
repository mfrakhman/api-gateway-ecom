import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Genders')
@Controller('genders')
export class GendersController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get productUrl() {
    return this.configService.get<string>('PRODUCT_SERVICE_URL');
  }

  @Get()
  async findAll() {
    const res = await firstValueFrom(this.httpService.get(`${this.productUrl}/genders`));
    return res.data;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(@Body() body: any) {
    const res = await firstValueFrom(this.httpService.post(`${this.productUrl}/genders`, body));
    return res.data;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async delete(@Param('id') id: string) {
    const res = await firstValueFrom(this.httpService.delete(`${this.productUrl}/genders/${id}`));
    return res.data;
  }
}
