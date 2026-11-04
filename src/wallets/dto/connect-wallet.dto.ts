import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class ConnectWalletDto {
  @ApiProperty({ example: '0x1234567890abcdef1234567890abcdef12345678' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'Must be a valid EVM address' })
  address: string;

  @ApiPropertyOptional({ example: 97 })
  @IsOptional()
  @IsInt()
  chainId?: number = 97;
}

