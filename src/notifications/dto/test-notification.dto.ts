import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class SendCustomAlertDto {
  @ApiProperty({
    example: '🤖 AI Agent Disbursement Settled',
    description: 'Title of the alert',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Agent DeepSeek-V3 disbursed 2.50 tUSD8 for inference compute refill.',
    description: 'Body message of the alert',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    enum: ['info', 'warning', 'critical', 'success'],
    default: 'info',
    description: 'Severity level of the notification',
  })
  @IsOptional()
  @IsEnum(['info', 'warning', 'critical', 'success'])
  severity?: 'info' | 'warning' | 'critical' | 'success';

  @ApiPropertyOptional({
    example: 'clxx1234567890',
    description: 'Optional treasury ID to store in-app insight',
  })
  @IsOptional()
  @IsString()
  treasuryId?: string;
}

