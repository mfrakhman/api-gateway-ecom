import { Controller, Get, NotFoundException, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import type { Request, Response } from 'express';

@Controller('storage')
export class StorageController {
  private readonly minio: Client;

  constructor(private readonly configService: ConfigService) {
    this.minio = new Client({
      endPoint: configService.get<string>('MINIO_ENDPOINT', 'minio'),
      port: Number(configService.get<number>('MINIO_PORT', 9000)),
      useSSL: configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: configService.get<string>('MINIO_SECRET_KEY', 'minioadmin'),
    });
  }

  @Get('*')
  async serveFile(@Req() req: Request, @Res() res: Response) {
    // req.path = /api/storage/bucket-name/path/to/object
    const match = req.path.match(/\/storage\/(.+)/)
    const rest = match?.[1]
    if (!rest) throw new NotFoundException()

    const slash = rest.indexOf('/')
    if (slash === -1) throw new NotFoundException()

    const raw = rest

    const bucket = raw.slice(0, slash)
    const objectName = raw.slice(slash + 1)


    try {
      const stat = await this.minio.statObject(bucket, objectName)
      const stream = await this.minio.getObject(bucket, objectName)
      res.setHeader('Content-Type', stat.metaData['content-type'] ?? 'application/octet-stream')
      res.setHeader('Content-Length', stat.size)
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      stream.pipe(res)
    } catch {
      throw new NotFoundException('File not found')
    }
  }
}
