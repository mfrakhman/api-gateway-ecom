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
    .addServer('https://api.mfrakhman.web.id/api', 'Production server')
    .addServer('http://localhost:3000/api', 'Local server')
    .addBearerAuth()
    .build();
  const document = () => SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document());
  app.getHttpAdapter().get('/health', (_req: any, res: any) => res.status(200).json({ status: 'ok' }));

  app.getHttpAdapter().get('/', async (_req: any, res: any) => {
    const services = [
      { name: 'Auth Service',         url: `${process.env.AUTH_SERVICE_URL}/health` },
      { name: 'Product Service',      url: `${process.env.PRODUCT_SERVICE_URL}/health` },
      { name: 'Order Service',        url: `${process.env.ORDER_SERVICE_URL}/health` },
      { name: 'Payment Service',      url: `${process.env.PAYMENT_SERVICE_URL}/actuator/health` },
    ];

    const results = await Promise.all(
      services.map(async ({ name, url }) => {
        try {
          const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
          return { name, healthy: r.ok };
        } catch {
          return { name, healthy: false };
        }
      }),
    );

    const rows = results.map(({ name, healthy }) => `
      <tr>
        <td>${name}</td>
        <td><span class="badge ${healthy ? 'up' : 'down'}">${healthy ? 'UP' : 'DOWN'}</span></td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Soleco API — Service Status</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0f1117; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: #1a1d27; border: 1px solid #2d3148; border-radius: 12px; padding: 2rem 2.5rem; min-width: 380px; }
    h1 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.25rem; }
    p.sub { font-size: 0.8rem; color: #64748b; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 0.65rem 0; border-bottom: 1px solid #2d3148; font-size: 0.9rem; }
    tr:last-child td { border-bottom: none; }
    td:last-child { text-align: right; }
    .badge { padding: 0.2rem 0.65rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
    .up   { background: #14532d; color: #4ade80; }
    .down { background: #450a0a; color: #f87171; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Soleco API</h1>
    <p class="sub">Service status — ${new Date().toUTCString()}</p>
    <table><tbody>${rows}</tbody></table>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  });

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new GatewayExceptionFilter());
  console.log('server running on port 3000');
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
