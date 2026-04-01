import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable automatic validation for all DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,       // strip unknown properties
    forbidNonWhitelisted: true, // throw error if unknown property is provided
    transform: true,       // automatically transform payloads to DTO instances
  }));

  const config = new DocumentBuilder()
    .setTitle('AI DevOps Copilot')
    .setDescription('API for AI DevOps Copilot Gateway')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
