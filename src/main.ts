import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GatewayExceptionFilter } from './common/interceptors/gateway-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['https://ecom.mfrakhman.web.id', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Gateway Service API')
    .setVersion('1.0.0')
    .setDescription('API documentation for the Gateway Service')
    .addServer('https://ecom.mfrakhman.web.id/api', 'Production server')
    .addServer('http://localhost:3000/api', 'Local server')
    .addBearerAuth()
    .build();
  const document = () => SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document());
  app.getHttpAdapter().get('/health', (_req: any, res: any) => res.status(200).json({ status: 'ok' }));
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new GatewayExceptionFilter());
  console.log('server running on port 3000');
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
