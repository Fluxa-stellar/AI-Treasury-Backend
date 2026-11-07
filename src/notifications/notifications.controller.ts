import { Controller, Get, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service.js';
import { SendCustomAlertDto } from './dto/test-notification.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { Public } from '../common/decorators/public.decorator.js';

@ApiTags('Notifications')
@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Check notification channel status (Telegram & In-App)' })
  @ApiResponse({ status: 200, description: 'Notification channel status' })
  getStatus() {
    const info = this.notificationsService.getChannelInfo();
    return {
      message: 'Notification status retrieved',
      data: {
        telegram: info,
        inApp: { active: true },
      },
    };
  }

  @Public()
  @Post('test-telegram')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a test notification to the configured Telegram chat' })
  @ApiResponse({ status: 200, description: 'Test notification result' })
  async sendTestNotification() {
    const sent = await this.notificationsService.sendCustomAlert(
      'Test Alert: Aevum Treasury Bot Connected',
      'This is a verification notification from your <b>AI Treasury Agent</b> on Aevum Testnet.\n\nAll real-time disbursement, threshold, and containment alerts will appear in this chat.',
      'success',
    );

    return {
      success: sent,
      message: sent
        ? 'Test notification successfully sent to Telegram!'
        : 'Could not send to Telegram. Please check TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env.',
    };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('custom')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dispatch a custom alert to Telegram and In-App Feed' })
  @ApiResponse({ status: 200, description: 'Alert dispatch result' })
  async sendCustomAlert(@Body() dto: SendCustomAlertDto) {
    const sent = await this.notificationsService.sendCustomAlert(
      dto.title,
      dto.message,
      dto.severity || 'info',
      dto.treasuryId,
    );

    return {
      success: sent,
      message: sent
        ? 'Alert dispatched to Telegram & recorded in treasury insights'
        : 'Notification recorded (Telegram delivery skipped: not configured)',
    };
  }
}

