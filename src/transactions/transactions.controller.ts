import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service.js';
import { ProposeTransactionDto } from './dto/propose-transaction.dto.js';
import { RecordTransactionDto } from './dto/record-transaction.dto.js';
import { QueryTransactionsDto } from './dto/query-transactions.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('propose')
  @ApiOperation({ summary: 'Propose a new transaction requiring user approval' })
  @ApiResponse({ status: 201, description: 'Proposal created' })
  async propose(
    @CurrentUser('userId') userId: string,
    @Body() dto: ProposeTransactionDto,
  ) {
    const data = await this.transactionsService.proposeTransaction(userId, dto);
    return {
      message: 'Transaction proposal submitted',
      data,
    };
  }

  @Post('record')
  @ApiOperation({ summary: 'Record and verify a submitted blockchain transaction' })
  @ApiResponse({ status: 201, description: 'Transaction recorded and verified' })
  async record(
    @CurrentUser('userId') userId: string,
    @Body() dto: RecordTransactionDto,
  ) {
    const data = await this.transactionsService.recordTransaction(userId, dto);
    return {
      message: 'Transaction recorded successfully',
      data,
    };
  }

  @Get(':treasuryId')
  @ApiOperation({ summary: 'Get paginated transaction history for a treasury' })
  @ApiResponse({ status: 200, description: 'Transactions list' })
  async list(
    @Param('treasuryId') treasuryId: string,
    @CurrentUser('userId') userId: string,
    @Query() query: QueryTransactionsDto,
  ) {
    const data = await this.transactionsService.listTransactions(treasuryId, userId, query);
    return {
      message: 'Transactions retrieved successfully',
      data,
    };
  }

  @Get(':treasuryId/status/:txHash')
  @ApiOperation({ summary: 'Check on-chain receipt and confirmation status of a transaction' })
  @ApiResponse({ status: 200, description: 'Status retrieved' })
  async getStatus(
    @Param('treasuryId') treasuryId: string,
    @Param('txHash') txHash: string,
    @CurrentUser('userId') userId: string,
  ) {
    const data = await this.transactionsService.getTransactionStatus(
      treasuryId,
      txHash,
      userId,
    );
    return {
      message: 'Status checked successfully',
      data,
    };
  }

  @Get(':treasuryId/pending')
  @ApiOperation({ summary: 'List pending transactions for a treasury' })
  @ApiResponse({ status: 200, description: 'Pending transactions' })
  async getPending(
    @Param('treasuryId') treasuryId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const data = await this.transactionsService.getPendingTransactions(treasuryId, userId);
    return {
      message: 'Pending transactions retrieved successfully',
      data,
    };
  }
}

