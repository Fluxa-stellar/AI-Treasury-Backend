import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateTreasuryDto {
  @ApiPropertyOptional({ example: 'Updated Treasury Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '0xFc6E3Ec48AB20fA72D88cb7c985d85E23971105A' })
  @IsOptional()
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{40}$/, { message: 'Contract address must be a valid EVM address' })
  contractAddress?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

