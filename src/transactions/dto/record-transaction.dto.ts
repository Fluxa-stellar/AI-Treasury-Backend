import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, Matches } from 'class-validator';
import { TransactionTypeDto } from './propose-transaction.dto.js';

export class RecordTransactionDto {
  @ApiProperty({ description: 'Treasury ID' })
  @IsString()
  @IsNotEmpty()
  treasuryId: string;

  @ApiProperty({
    description: 'Confirmed or submitted transaction hash on BNB Chain',
    example: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{64}$/, { message: 'Must be a valid 32-byte transaction hash' })
  txHash: string;

  @ApiProperty({ example: '0x1234567890abcdef1234567890abcdef12345678' })
  @IsString()
  @IsNotEmpty()
  fromAddress: string;

  @ApiProperty({ example: '0xabcdef1234567890abcdef1234567890abcdef12' })
  @IsString()
  @IsNotEmpty()
  toAddress: string;

  @ApiPropertyOptional({ default: '0x0000000000000000000000000000000000000000' })
  @IsOptional()
  @IsString()
  tokenAddress?: string = '0x0000000000000000000000000000000000000000';

  @ApiPropertyOptional({ example: 'BNB' })
  @IsOptional()
  @IsString()
  tokenSymbol?: string = 'BNB';

  @ApiProperty({ example: '0.25' })
  @IsNotEmpty()
  @IsNumberString()
  amount: string;

  @ApiPropertyOptional({ enum: TransactionTypeDto, default: TransactionTypeDto.TRANSFER })
  @IsOptional()
  @IsEnum(TransactionTypeDto)
  type?: TransactionTypeDto = TransactionTypeDto.TRANSFER;

  @ApiPropertyOptional({ description: 'Optional approval ID if executing an approved request' })
  @IsOptional()
  @IsString()
  approvalId?: string;
}

