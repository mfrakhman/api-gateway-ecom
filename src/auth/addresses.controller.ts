import {
  Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, UseGuards,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Addresses')
@Controller('addresses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AddressesController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get url() {
    return this.configService.get<string>('AUTH_SERVICE_URL');
  }

  private headers(req: any) {
    return { Authorization: req.headers['authorization'] };
  }

  @Get()
  @ApiOperation({ summary: 'List addresses for current user' })
  async findAll(@Req() req: any) {
    const res = await firstValueFrom(
      this.httpService.get(`${this.url}/addresses`, { headers: this.headers(req) }),
    );
    return res.data;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new address' })
  async create(@Req() req: any, @Body() body: any) {
    const res = await firstValueFrom(
      this.httpService.post(`${this.url}/addresses`, body, { headers: this.headers(req) }),
    );
    return res.data;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an address' })
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const res = await firstValueFrom(
      this.httpService.put(`${this.url}/addresses/${id}`, body, { headers: this.headers(req) }),
    );
    return res.data;
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Set address as default' })
  async setDefault(@Req() req: any, @Param('id') id: string) {
    const res = await firstValueFrom(
      this.httpService.patch(`${this.url}/addresses/${id}/default`, {}, { headers: this.headers(req) }),
    );
    return res.data;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an address' })
  async delete(@Req() req: any, @Param('id') id: string) {
    const res = await firstValueFrom(
      this.httpService.delete(`${this.url}/addresses/${id}`, { headers: this.headers(req) }),
    );
    return res.data;
  }
}
