import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GatewayExceptionFilter } from './common/interceptors/gateway-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new GatewayExceptionFilter());
  console.log('server running on port 3000');
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
