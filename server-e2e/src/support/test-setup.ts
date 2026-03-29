import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../server/src/app.module';
import { GlobalExceptionFilter } from '../../../server/src/common/filters/global-exception.filter';
import { PrismaExceptionFilter } from '../../../server/src/common/filters/prisma-exception.filter';
import { TransformResponseInterceptor } from '../../../server/src/common/middlewares/transform-response.interceptor';
import cookieParser from 'cookie-parser';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableVersioning({ type: VersioningType.URI, prefix: 'v' });
  app.useGlobalInterceptors(new TransformResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter(), new PrismaExceptionFilter());
  
  await app.init();
  return app;
}
