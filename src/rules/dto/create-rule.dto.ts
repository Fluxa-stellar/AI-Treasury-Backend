import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export enum RuleTypeDto {
  LOW_BALANCE = 'LOW_BALANCE',
  LARGE_TRANSACTION = 'LARGE_TRANSACTION',
  SCHEDULED_TRANSFER = 'SCHEDULED_TRANSFER',
  EXCESS_BALANCE = 'EXCESS_BALANCE',
  INCOMING_PAYMENT = 'INCOMING_PAYMENT',
}

export enum ExecutionModeDto {
  RECOMMEND = 'RECOMMEND',
  REQUIRE_APPROVAL = 'REQUIRE_APPROVAL',
  AUTOMATIC = 'AUTOMATIC',
}

export class CreateRuleDto {
  @ApiProperty({ example: 'Large Outgoing Alert' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Alerts when any transaction exceeds 5 BNB' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: RuleTypeDto, example: RuleTypeDto.LARGE_TRANSACTION })
  @IsEnum(RuleTypeDto)
  type: RuleTypeDto;

  @ApiProperty({
    example: { threshold: '5.0', token: 'BNB' },
    description: 'Condition parameters for rule evaluation',
  })
  @IsObject()
  condition: Record<string, any>;

  @ApiProperty({
    example: { notify: true, createApproval: false },
    description: 'Action parameters when condition triggers',
  })
  @IsObject()
  action: Record<string, any>;

  @ApiPropertyOptional({ enum: ExecutionModeDto, default: ExecutionModeDto.REQUIRE_APPROVAL })
  @IsOptional()
  @IsEnum(ExecutionModeDto)
  executionMode?: ExecutionModeDto = ExecutionModeDto.REQUIRE_APPROVAL;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

