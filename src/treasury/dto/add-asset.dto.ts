import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class AddAssetDto {
  @ApiProperty({
    description: 'BEP-20 token address or 0x0 for native BNB',
    example: '0x337610d27c682E347C9cD60BE4B3b107C9d34dDd', // USDT on BSC Testnet
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'Must be a valid token address' })
  tokenAddress: string;
}

