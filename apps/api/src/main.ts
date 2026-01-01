import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Security middleware
  app.use(helmet())

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  })

  // Global prefix
  app.setGlobalPrefix('api')

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Shopping Assistant API')
    .setDescription('API for product monitoring and alerting')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('watchers', 'Product watcher endpoints')
    .addTag('alerts', 'Alert endpoints')
    .addTag('webhooks', 'Webhook configuration')
    .addTag('billing', 'Subscription and billing')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  const port = process.env.PORT || 3001
  await app.listen(port)

  console.log(`🚀 API server running on http://localhost:${port}`)
  console.log(`📚 API docs available at http://localhost:${port}/api/docs`)
}

bootstrap()
