import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Client } from 'minio';
import { ConfigService } from '@nestjs/config';

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  private readonly minio: Client;

  constructor(private readonly configService: ConfigService) {
    this.minio = new Client({
      endPoint: configService.get<string>('MINIO_ENDPOINT', 'minio'),
      port: configService.get<number>('MINIO_PORT', 9000),
      useSSL: configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
    });
  }

  @Get(':bucket/*')
  @ApiOperation({ summary: 'Serve stored file from MinIO' })
  @ApiParam({ name: 'bucket', type: 'string' })
  async serveFile(
    @Param('bucket') bucket: string,
    @Param('0') objectPath: string,
    @Res() res: Response,
  ) {
    const stream = await this.minio.getObject(bucket, objectPath);
    const stat = await this.minio.statObject(bucket, objectPath);
    res.setHeader('Content-Type', stat.metaData['content-type'] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    stream.pipe(res);
  }
}
