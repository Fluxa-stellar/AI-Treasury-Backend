import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateTreasuryDto {
  @ApiProperty({ example: 'Company Operations Treasury' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Wallet ID belonging to the user to associate as primary treasury wallet',
  })
  @IsOptional()
  @IsString()
  walletId?: string;

  @ApiPropertyOptional({
    description: 'TreasuryVault smart contract address on BNB Chain',
    example: '0xFc6E3Ec48AB20fA72D88cb7c985d85E23971105A',
  })
  @IsOptional()
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'Contract address must be a valid EVM address' })
  contractAddress?: string;

  @ApiPropertyOptional({ example: 97 })
  @IsOptional()
  @IsInt()
  chainId?: number = 97;
}

