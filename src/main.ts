import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. CORS Configuration
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for development & staging
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // 2. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 3. Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('AI Treasury Agent API')
    .setDescription(
      'REST API for AI-powered Programmable Treasury Management on BNB Chain.\n\n' +
        'Features:\n' +
        '- Web3 Nonce & Signature Authentication\n' +
        '- Treasury Management & On-chain Vault Integration\n' +
        '- BNB & BEP-20 Live Balance Verification\n' +
        '- Transaction Proposals & Approval Workflows\n' +
        '- Rule Engine & Automated Limit Enforcement\n' +
        '- AI Assistant with Grounded Treasury Insights & Anomaly Detection',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT token obtained from /api/auth/verify',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'AI Treasury Agent API Docs',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');

  logger.log(`=======================================================`);
  logger.log(`🚀 AI Treasury Agent Backend running on port ${port}`);
  logger.log(`📚 Swagger Documentation: http://localhost:${port}/api/docs`);
  logger.log(`🩺 Health Check: http://localhost:${port}/api/health`);
  logger.log(`=======================================================`);
}

bootstrap();
