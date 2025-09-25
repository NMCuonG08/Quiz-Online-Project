import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ValidationPipe,
  VersioningType,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { TransformResponseInterceptor } from '@/common/interceptors/transform-response.interceptor';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { PrismaExceptionFilter } from '@/common/filters/prisma-exception.filter';
import { JobRepository } from '@/common/repositories/job.repository';
import { QuizService } from '@/modules/quizz/services/quiz.service';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Add cookie parser middleware
  app.use(cookieParser());

  // Debug Redis connection
  console.log('Environment variables:');
  console.log('REDIS_URL:', process.env.REDIS_URL);
  console.log('REDIS_HOST:', process.env.REDIS_HOST);
  console.log('REDIS_PORT:', process.env.REDIS_PORT);

  // Helper function to map validation errors to error codes
  const getValidationErrorCode = (error: any) => {
    const constraints = Object.keys(error.constraints || {});
    if (
      constraints.includes('isNotEmpty') ||
      constraints.includes('isNotBlank')
    ) {
      return 'REQUIRED';
    }
    if (constraints.includes('isEmail')) {
      return 'INVALID_EMAIL';
    }
    if (constraints.includes('minLength') || constraints.includes('min')) {
      return 'MIN_LENGTH';
    }
    if (constraints.includes('maxLength') || constraints.includes('max')) {
      return 'MAX_LENGTH';
    }
    if (constraints.includes('isNumber') || constraints.includes('isInt')) {
      return 'INVALID_NUMBER';
    }
    if (constraints.includes('isIn') || constraints.includes('isEnum')) {
      return 'INVALID_VALUE';
    }
    if (constraints.includes('matches') || constraints.includes('isUrl')) {
      return 'INVALID_FORMAT';
    }
    if (constraints.includes('min') || constraints.includes('max')) {
      return 'OUT_OF_RANGE';
    }
    return 'VALIDATION_ERROR';
  };

  // Helper function to extract and format constraint information
  const extractConstraint = (error: any) => {
    const constraints = error.constraints || {};
    const constraintInfo: any = {};

    // Extract min/max values for length and number constraints
    if (constraints.minLength) {
      constraintInfo.min =
        error.contexts?.minLength?.min || error.contexts?.minLength?.value;
    }
    if (constraints.maxLength) {
      constraintInfo.max =
        error.contexts?.maxLength?.max || error.contexts?.maxLength?.value;
    }
    if (constraints.min) {
      constraintInfo.min =
        error.contexts?.min?.min || error.contexts?.min?.value;
    }
    if (constraints.max) {
      constraintInfo.max =
        error.contexts?.max?.max || error.contexts?.max?.value;
    }

    // Extract pattern for regex constraints
    if (constraints.matches) {
      constraintInfo.pattern = error.contexts?.matches?.pattern;
    }

    // Extract allowed values for enum constraints
    if (constraints.isIn) {
      constraintInfo.allowedValues = error.contexts?.isIn?.value;
    }

    // Extract specific constraint values from validation decorators
    if (error.contexts) {
      Object.keys(error.contexts).forEach((key) => {
        const context = error.contexts[key];
        if (context && typeof context === 'object') {
          if (context.min !== undefined) constraintInfo.min = context.min;
          if (context.max !== undefined) constraintInfo.max = context.max;
          if (context.value !== undefined) constraintInfo.value = context.value;
          if (context.pattern !== undefined)
            constraintInfo.pattern = context.pattern;
        }
      });
    }

    return Object.keys(constraintInfo).length > 0 ? constraintInfo : undefined;
  };

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const formattedErrors = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}).join(', '),
          code: getValidationErrorCode(error),
          value: error.value,
          constraint: extractConstraint(error),
        }));

        return new HttpException(
          {
            message: 'Validation failed',
            errors: formattedErrors,
          },
          HttpStatus.BAD_REQUEST,
        );
      },
    }),
  );
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
  });

  app.useGlobalInterceptors(new TransformResponseInterceptor());
  app.useGlobalFilters(
    new GlobalExceptionFilter(),
    new PrismaExceptionFilter(),
  );

  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL || false
        : [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
          ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('My API')
    .setDescription('API documentation with Swagger and JWT Auth')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  // Initialize job repository with services that have job handlers
  const jobRepository = app.get(JobRepository);
  const quizService = app.get(QuizService);
  jobRepository.setupWithInstances([quizService]);

  // Start workers to process jobs
  jobRepository.startWorkers();

  const port = process.env.PORT || 5000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port: ${port}`);
}
void bootstrap();
