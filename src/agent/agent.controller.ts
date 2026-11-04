import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AgentService } from './agent.service.js';
import { AgentChatDto } from './dto/agent-chat.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('AI Agent')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chat with AI Treasury Agent with grounded real-time treasury context' })
  @ApiResponse({ status: 200, description: 'AI Response and extracted recommendations' })
  async chat(
    @CurrentUser('userId') userId: string,
    @Body() dto: AgentChatDto,
  ) {
    const data = await this.agentService.chat(userId, dto);
    return {
      message: 'AI response generated successfully',
      data,
    };
  }

  @Get(':treasuryId/insights')
  @ApiOperation({ summary: 'Get AI-generated treasury insights' })
  @ApiResponse({ status: 200, description: 'Insights list' })
  async getInsights(
    @Param('treasuryId') treasuryId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const data = await this.agentService.getInsights(treasuryId, userId);
    return {
      message: 'Insights retrieved successfully',
      data,
    };
  }

  @Get(':treasuryId/recommendations')
  @ApiOperation({ summary: 'Get AI proposed recommendations for a treasury' })
  @ApiResponse({ status: 200, description: 'Recommendations list' })
  async getRecommendations(
    @Param('treasuryId') treasuryId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const data = await this.agentService.getRecommendations(treasuryId, userId);
    return {
      message: 'Recommendations retrieved successfully',
      data,
    };
  }

  @Get(':treasuryId/messages')
  @ApiOperation({ summary: 'Get conversation history with AI Agent' })
  @ApiResponse({ status: 200, description: 'Chat message history' })
  async getMessages(
    @Param('treasuryId') treasuryId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const data = await this.agentService.getMessages(treasuryId, userId);
    return {
      message: 'Chat history retrieved successfully',
      data,
    };
  }

  @Post(':treasuryId/analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run comprehensive anomaly detection and financial health analysis' })
  @ApiResponse({ status: 200, description: 'Analysis results' })
  async analyze(
    @Param('treasuryId') treasuryId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const data = await this.agentService.analyzeTreasury(treasuryId, userId);
    return {
      message: 'Treasury analyzed successfully',
      data,
    };
  }
}

