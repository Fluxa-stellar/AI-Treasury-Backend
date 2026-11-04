import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, Matches } from 'class-validator';

export enum TransactionTypeDto {
  DEPOSIT = 'DEPOSIT',
  WITHDRAW = 'WITHDRAW',
  TRANSFER = 'TRANSFER',
  APPROVAL = 'APPROVAL',
  CONTRACT_EXECUTION = 'CONTRACT_EXECUTION',
}

export class ProposeTransactionDto {
  @ApiProperty({ description: 'Treasury ID' })
  @IsString()
  @IsNotEmpty()
  treasuryId: string;

  @ApiProperty({
    description: 'Target recipient address',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'Recipient must be a valid EVM address' })
  toAddress: string;

  @ApiPropertyOptional({
    description: 'Token address (default 0x0 for native BNB)',
    default: '0x0000000000000000000000000000000000000000',
  })
  @IsOptional()
  @IsString()
  tokenAddress?: string = '0x0000000000000000000000000000000000000000';

  @ApiPropertyOptional({ example: 'BNB' })
  @IsOptional()
  @IsString()
  tokenSymbol?: string = 'BNB';

  @ApiProperty({ example: '1.5', description: 'Amount in human-readable formatted units' })
  @IsNotEmpty()
  @IsNumberString()
  amount: string;

  @ApiPropertyOptional({ enum: TransactionTypeDto, default: TransactionTypeDto.TRANSFER })
  @IsOptional()
  @IsEnum(TransactionTypeDto)
  type?: TransactionTypeDto = TransactionTypeDto.TRANSFER;

  @ApiPropertyOptional({ example: 'Transfer funds for monthly server hosting' })
  @IsOptional()
  @IsString()
  reason?: string;
}

