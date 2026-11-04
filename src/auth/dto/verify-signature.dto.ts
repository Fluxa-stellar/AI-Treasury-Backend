import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class VerifySignatureDto {
  @ApiProperty({
    description: 'EVM wallet address',
    example: '0x1234567890abcdef1234567890abcdef12345678',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'Address must be a valid EVM address' })
  address: string;

  @ApiProperty({
    description: 'Hex-encoded signature from personal_sign / signMessage',
    example: '0x...',
  })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({
    description: 'Original sign-in message that was signed',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}

