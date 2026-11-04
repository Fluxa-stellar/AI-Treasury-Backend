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
import { ApprovalsService } from './approvals.service.js';
import { ExecuteApprovalDto } from './dto/execute-approval.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Approvals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/approvals')
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get(':treasuryId')
  @ApiOperation({ summary: 'List all approval requests for a treasury' })
  @ApiResponse({ status: 200, description: 'Approvals list' })
  async list(
    @Param('treasuryId') treasuryId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const data = await this.approvalsService.listApprovals(treasuryId, userId);
    return {
      message: 'Approvals retrieved successfully',
      data,
    };
  }

  @Get(':treasuryId/:id')
  @ApiOperation({ summary: 'Get details of a specific approval request' })
  @ApiResponse({ status: 200, description: 'Approval details' })
  async getById(
    @Param('treasuryId') treasuryId: string,
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    const data = await this.approvalsService.getApprovalById(treasuryId, id, userId);
    return {
      message: 'Approval details retrieved successfully',
      data,
    };
  }

  @Post(':treasuryId/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a proposed treasury action' })
  @ApiResponse({ status: 200, description: 'Proposal approved' })
  async approve(
    @Param('treasuryId') treasuryId: string,
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    const data = await this.approvalsService.approve(treasuryId, id, userId);
    return {
      message: 'Action approved successfully',
      data,
    };
  }

  @Post(':treasuryId/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a proposed treasury action' })
  @ApiResponse({ status: 200, description: 'Proposal rejected' })
  async reject(
    @Param('treasuryId') treasuryId: string,
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body('reason') reason?: string,
  ) {
    const data = await this.approvalsService.reject(treasuryId, id, userId, reason);
    return {
      message: 'Action rejected successfully',
      data,
    };
  }

  @Post(':treasuryId/:id/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record execution hash and verify on-chain settlement' })
  @ApiResponse({ status: 200, description: 'Execution recorded' })
  async execute(
    @Param('treasuryId') treasuryId: string,
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: ExecuteApprovalDto,
  ) {
    const data = await this.approvalsService.recordExecution(
      treasuryId,
      id,
      userId,
      dto.txHash,
    );
    return {
      message: 'Approval execution recorded and verified',
      data,
    };
  }
}

