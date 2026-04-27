import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Sizes')
@Controller('sizes')
export class SizesController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get productUrl() {
    return this.configService.get<string>('PRODUCT_SERVICE_URL');
  }

  @Get()
  @ApiOperation({ summary: 'Get all sizes, optionally filtered by sizeGroup' })
  @ApiQuery({ name: 'sizeGroup', required: false, description: 'apparel | footwear_uk | waist' })
  async getAll(@Query('sizeGroup') sizeGroup?: string) {
    const res = await firstValueFrom(
      this.httpService.get(`${this.productUrl}/sizes`, {
        params: sizeGroup ? { sizeGroup } : {},
      }),
    );
    return res.data;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get size by ID' })
  async getById(@Param('id') id: string) {
    const res = await firstValueFrom(
      this.httpService.get(`${this.productUrl}/sizes/${id}`),
    );
    return res.data;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a size' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['sizeGroup', 'name', 'slug', 'sortOrder'],
      properties: {
        sizeGroup: { type: 'string', description: 'apparel | footwear_uk | waist' },
        name: { type: 'string', example: 'M' },
        slug: { type: 'string', example: 'm' },
        sortOrder: { type: 'integer', example: 3 },
      },
    },
  })
  async create(@Body() body: any) {
    const res = await firstValueFrom(
      this.httpService.post(`${this.productUrl}/sizes`, body),
    );
    return res.data;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a size' })
  async update(@Param('id') id: string, @Body() body: any) {
    const res = await firstValueFrom(
      this.httpService.patch(`${this.productUrl}/sizes/${id}`, body),
    );
    return res.data;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a size' })
  async delete(@Param('id') id: string) {
    const res = await firstValueFrom(
      this.httpService.delete(`${this.productUrl}/sizes/${id}`),
    );
    return res.data;
  }
}
