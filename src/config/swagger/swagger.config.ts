import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('My API')
  .setDescription('API documentation with Swagger and JWT Auth')
  .setVersion('1.0')
  .addBearerAuth(

  )
  .build();