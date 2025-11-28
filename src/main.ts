import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AxiosErrorInterceptor } from './common/interceptors/axios-exception.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new AxiosErrorInterceptor());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
