import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RulesService } from './rules.service.js';
import { CreateRuleDto } from './dto/create-rule.dto.js';
import { UpdateRuleDto } from './dto/update-rule.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Post(':treasuryId')
  @ApiOperation({ summary: 'Create a new automated rule for a treasury' })
  @ApiResponse({ status: 201, description: 'Rule created' })
  async create(
    @Param('treasuryId') treasuryId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateRuleDto,
  ) {
    const data = await this.rulesService.createRule(treasuryId, userId, dto);
    return {
      message: 'Rule created successfully',
      data,
    };
  }

  @Get(':treasuryId')
  @ApiOperation({ summary: 'List all rules configured for a treasury' })
  @ApiResponse({ status: 200, description: 'Rules list' })
  async list(
    @Param('treasuryId') treasuryId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const data = await this.rulesService.listRules(treasuryId, userId);
    return {
      message: 'Rules retrieved successfully',
      data,
    };
  }

  @Get(':treasuryId/:id')
  @ApiOperation({ summary: 'Get details of a specific rule' })
  @ApiResponse({ status: 200, description: 'Rule details' })
  async getById(
    @Param('treasuryId') treasuryId: string,
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    const data = await this.rulesService.getRuleById(treasuryId, id, userId);
    return {
      message: 'Rule retrieved successfully',
      data,
    };
  }

  @Patch(':treasuryId/:id')
  @ApiOperation({ summary: 'Update an existing rule' })
  @ApiResponse({ status: 200, description: 'Rule updated' })
  async update(
    @Param('treasuryId') treasuryId: string,
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateRuleDto,
  ) {
    const data = await this.rulesService.updateRule(treasuryId, id, userId, dto);
    return {
      message: 'Rule updated successfully',
      data,
    };
  }

  @Delete(':treasuryId/:id')
  @ApiOperation({ summary: 'Delete a rule' })
  @ApiResponse({ status: 200, description: 'Rule deleted' })
  async delete(
    @Param('treasuryId') treasuryId: string,
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    const data = await this.rulesService.deleteRule(treasuryId, id, userId);
    return {
      message: 'Rule deleted successfully',
      data,
    };
  }

  @Post(':treasuryId/:id/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle a rule active/inactive status' })
  @ApiResponse({ status: 200, description: 'Rule status toggled' })
  async toggle(
    @Param('treasuryId') treasuryId: string,
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    const data = await this.rulesService.toggleRule(treasuryId, id, userId);
    return {
      message: `Rule is now ${data.isActive ? 'active' : 'inactive'}`,
      data,
    };
  }

  @Post(':treasuryId/evaluate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger evaluation of all active rules against current state' })
  @ApiResponse({ status: 200, description: 'Rules evaluated' })
  async evaluate(
    @Param('treasuryId') treasuryId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const data = await this.rulesService.evaluateRules(treasuryId, userId);
    return {
      message: 'Rules evaluated successfully',
      data,
    };
  }
}

