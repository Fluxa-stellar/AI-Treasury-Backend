import { Controller, Get, Post, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get(':treasuryId')
  @ApiOperation({ summary: 'Get treasury financial analytics, inflows, outflows, and asset distribution' })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  async getAnalytics(
    @Param('treasuryId') treasuryId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const data = await this.analyticsService.getTreasuryAnalytics(treasuryId, userId);
    return {
      message: 'Analytics retrieved successfully',
      data,
    };
  }

  @Get(':treasuryId/snapshots')
  @ApiOperation({ summary: 'Get historical balance snapshots for charts' })
  @ApiResponse({ status: 200, description: 'Snapshots list' })
  async getSnapshots(
    @Param('treasuryId') treasuryId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const data = await this.analyticsService.getSnapshots(treasuryId, userId);
    return {
      message: 'Snapshots retrieved successfully',
      data,
    };
  }

  @Post(':treasuryId/snapshot')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Capture an on-chain balance snapshot for a treasury' })
  @ApiResponse({ status: 200, description: 'Snapshot captured' })
  async capture(
    @Param('treasuryId') treasuryId: string,
    @CurrentUser('userId') userId: string,
  ) {
    const data = await this.analyticsService.captureSnapshot(treasuryId, userId);
    return {
      message: 'Snapshot captured successfully',
      data,
    };
  }
}

