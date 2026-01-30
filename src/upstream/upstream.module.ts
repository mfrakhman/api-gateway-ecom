import { Module } from '@nestjs/common';
import { UpstreamService } from './upstream.service';

@Module({
  providers: [UpstreamService]
})
export class UpstreamModule {}
