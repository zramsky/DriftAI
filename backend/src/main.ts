import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: true }));
  
  // Configure CORS
  const corsOrigin = process.env.CORS_ORIGIN || process.env.NODE_ENV === 'development' ? true : ['https://contractrecplatform.web.app'];
  app.enableCors({ 
    origin: corsOrigin, 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  app.use(helmet());
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`Application is running on port ${port}`);
}
bootstrap();
