import { Module } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { AuthController } from './auth.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [AuthController],
  providers: [JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
