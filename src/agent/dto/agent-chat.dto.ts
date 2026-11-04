import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AgentChatDto {
  @ApiProperty({ description: 'Target Treasury ID' })
  @IsString()
  @IsNotEmpty()
  treasuryId: string;

  @ApiProperty({
    description: 'User message or question for the AI Treasury Agent',
    example: 'Analyze my treasury and tell me where most of my funds are allocated.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;
}

