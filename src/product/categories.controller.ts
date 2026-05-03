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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get productUrl() {
    return this.configService.get<string>('PRODUCT_SERVICE_URL');
  }

  @Get()
  @ApiOperation({ summary: 'Get categories (filterable by genderId or groupId)' })
  async getAll(@Query('genderId') genderId?: string, @Query('groupId') groupId?: string) {
    const params = new URLSearchParams();
    if (genderId) params.set('genderId', genderId);
    if (groupId) params.set('groupId', groupId);
    const qs = params.toString() ? `?${params}` : '';
    const res = await firstValueFrom(
      this.httpService.get(`${this.productUrl}/categories${qs}`),
    );
    return res.data;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  async getById(@Param('id') id: string) {
    const res = await firstValueFrom(
      this.httpService.get(`${this.productUrl}/categories/${id}`),
    );
    return res.data;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a category' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'slug'],
      properties: {
        name: { type: 'string' },
        slug: { type: 'string' },
        parentId: { type: 'string', format: 'uuid' },
        displayOrder: { type: 'integer', default: 0 },
      },
    },
  })
  async create(@Body() body: any) {
    const res = await firstValueFrom(
      this.httpService.post(`${this.productUrl}/categories`, body),
    );
    return res.data;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category' })
  async update(@Param('id') id: string, @Body() body: any) {
    const res = await firstValueFrom(
      this.httpService.patch(`${this.productUrl}/categories/${id}`, body),
    );
    return res.data;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a category' })
  async delete(@Param('id') id: string) {
    const res = await firstValueFrom(
      this.httpService.delete(`${this.productUrl}/categories/${id}`),
    );
    return res.data;
  }
}
