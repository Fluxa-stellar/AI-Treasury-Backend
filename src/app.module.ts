import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import configuration from './config/configuration.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { BlockchainModule } from './blockchain/blockchain.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { WalletsModule } from './wallets/wallets.module.js';
import { TreasuryModule } from './treasury/treasury.module.js';
import { TransactionsModule } from './transactions/transactions.module.js';
import { ApprovalsModule } from './approvals/approvals.module.js';
import { RulesModule } from './rules/rules.module.js';
import { AgentModule } from './agent/agent.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { HealthModule } from './health/health.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    BlockchainModule,
    AuthModule,
    UsersModule,
    WalletsModule,
    TreasuryModule,
    TransactionsModule,
    ApprovalsModule,
    RulesModule,
    AgentModule,
    AnalyticsModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
