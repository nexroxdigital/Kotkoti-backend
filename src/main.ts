import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Kotkoti APIs')
    .setDescription('The Kotkoti API description')
    .setVersion('1.0')
    .addTag('Kotkoti')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 8000);

  console.log(`✅ Server is running on http://localhost:${process.env.PORT}`);
  console.log(`✅ API documentation http://localhost:${process.env.PORT}/api`);
}
bootstrap();
