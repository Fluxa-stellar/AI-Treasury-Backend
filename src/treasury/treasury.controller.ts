import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { TreasuryService } from './treasury.service.js';
import { CreateTreasuryDto } from './dto/create-treasury.dto.js';
import { UpdateTreasuryDto } from './dto/update-treasury.dto.js';
import { AddAssetDto } from './dto/add-asset.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Treasury')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/treasury')
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new treasury vault record' })
  @ApiResponse({ status: 201, description: 'Treasury created' })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateTreasuryDto,
  ) {
    const data = await this.treasuryService.createTreasury(userId, dto);
    return {
      message: 'Treasury created successfully',
      data,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all treasuries owned by current user' })
  @ApiResponse({ status: 200, description: 'Treasuries list' })
  async list(@CurrentUser('userId') userId: string) {
    const data = await this.treasuryService.listUserTreasuries(userId);
    return {
      message: 'Treasuries retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get treasury details by ID' })
  @ApiResponse({ status: 200, description: 'Treasury details' })
  async getById(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    const data = await this.treasuryService.getTreasuryById(id, userId);
    return {
      message: 'Treasury retrieved successfully',
      data,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update treasury details' })
  @ApiResponse({ status: 200, description: 'Treasury updated' })
  async update(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateTreasuryDto,
  ) {
    const data = await this.treasuryService.updateTreasury(id, userId, dto);
    return {
      message: 'Treasury updated successfully',
      data,
    };
  }

  @Get(':id/overview')
  @ApiOperation({ summary: 'Get comprehensive overview of treasury balances, limits, and activity' })
  @ApiResponse({ status: 200, description: 'Overview retrieved' })
  async getOverview(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    const data = await this.treasuryService.getOverview(id, userId);
    return {
      message: 'Treasury overview retrieved successfully',
      data,
    };
  }

  @Get(':id/assets')
  @ApiOperation({ summary: 'Get all tracked assets and balances for a treasury' })
  @ApiResponse({ status: 200, description: 'Assets list' })
  async getAssets(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    const data = await this.treasuryService.getAssets(id, userId);
    return {
      message: 'Treasury assets retrieved successfully',
      data,
    };
  }

  @Post(':id/assets')
  @ApiOperation({ summary: 'Add a new token/asset to track in the treasury' })
  @ApiResponse({ status: 201, description: 'Asset added' })
  async addAsset(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: AddAssetDto,
  ) {
    const data = await this.treasuryService.addAsset(id, userId, dto);
    return {
      message: 'Asset added successfully',
      data,
    };
  }

  @Post(':id/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync and update live on-chain balances for all treasury assets' })
  @ApiResponse({ status: 200, description: 'Balances synced' })
  async sync(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    const data = await this.treasuryService.syncTreasuryBalances(id, userId);
    return {
      message: 'Balances synced with BNB Chain successfully',
      data,
    };
  }
}

