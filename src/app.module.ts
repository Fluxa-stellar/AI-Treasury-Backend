import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthsModule } from './auths/auths.module';
import { WalletsModule } from './wallets/wallets.module';
import { TreasuryModule } from './treasury/treasury.module';
import { TransactionsModule } from './transactions/transactions.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthsModule, WalletsModule, TreasuryModule, TransactionsModule],
})
export class AppModule { }
