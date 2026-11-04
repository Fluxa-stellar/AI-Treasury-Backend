import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { RuleTypeDto, ExecutionModeDto } from './create-rule.dto.js';

export class UpdateRuleDto {
  @ApiPropertyOptional({ example: 'Updated Rule Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: RuleTypeDto })
  @IsOptional()
  @IsEnum(RuleTypeDto)
  type?: RuleTypeDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  condition?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  action?: Record<string, any>;

  @ApiPropertyOptional({ enum: ExecutionModeDto })
  @IsOptional()
  @IsEnum(ExecutionModeDto)
  executionMode?: ExecutionModeDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

