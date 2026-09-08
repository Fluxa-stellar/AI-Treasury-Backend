import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Using NestJS's built-in Logger instead of standard console.log is a best practice
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // In Prisma 7, we leave this empty. 
    // Prisma will automatically read DATABASE_URL via prisma.config.ts / .env
    super();
  }

  async onModuleInit() {
    this.logger.log('Connecting to Prisma...');
    try {
      await this.$connect();
      this.logger.log('Prisma connected successfully to Neon');
    } catch (err) {
      this.logger.error('Prisma connection failed:', err);
      throw err;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
