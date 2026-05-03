import {
  Controller, Delete, Get, Param, Req, UseGuards,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all users (admin)' })
  async findAll(@Req() req: any) {
    const url = this.configService.get<string>('AUTH_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.get(`${url}/users`, {
        headers: { Authorization: req.headers['authorization'] },
      }),
    );
    return res.data;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (admin)' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const url = this.configService.get<string>('AUTH_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.get(`${url}/users/${id}`, {
        headers: { Authorization: req.headers['authorization'] },
      }),
    );
    return res.data;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user (admin)' })
  async deleteUser(@Param('id') id: string, @Req() req: any) {
    const url = this.configService.get<string>('AUTH_SERVICE_URL');
    const res = await firstValueFrom(
      this.httpService.delete(`${url}/users/${id}`, {
        headers: { Authorization: req.headers['authorization'] },
      }),
    );
    return res.data;
  }
}
