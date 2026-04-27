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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Colors')
@Controller('colors')
export class ColorsController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get productUrl() {
    return this.configService.get<string>('PRODUCT_SERVICE_URL');
  }

  @Get()
  @ApiOperation({ summary: 'Get all colors ordered by displayOrder' })
  async getAll() {
    const res = await firstValueFrom(
      this.httpService.get(`${this.productUrl}/colors`),
    );
    return res.data;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get color by ID' })
  async getById(@Param('id') id: string) {
    const res = await firstValueFrom(
      this.httpService.get(`${this.productUrl}/colors/${id}`),
    );
    return res.data;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a color' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'slug', 'hex'],
      properties: {
        name: { type: 'string', example: 'Camel' },
        slug: { type: 'string', example: 'camel' },
        hex: { type: 'string', example: '#B89968' },
        displayOrder: { type: 'integer', default: 0 },
      },
    },
  })
  async create(@Body() body: any) {
    const res = await firstValueFrom(
      this.httpService.post(`${this.productUrl}/colors`, body),
    );
    return res.data;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a color' })
  async update(@Param('id') id: string, @Body() body: any) {
    const res = await firstValueFrom(
      this.httpService.patch(`${this.productUrl}/colors/${id}`, body),
    );
    return res.data;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a color' })
  async delete(@Param('id') id: string) {
    const res = await firstValueFrom(
      this.httpService.delete(`${this.productUrl}/colors/${id}`),
    );
    return res.data;
  }
}
