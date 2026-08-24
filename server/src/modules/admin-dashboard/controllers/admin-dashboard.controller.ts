import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { AdminDashboardService } from '../services/admin-dashboard.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard, Authenticated } from '@/common/guards/auth.guard';
import { Permission } from '@/common/enums/permisson';

@Controller('api/admin/dashboard')
@ApiTags('Admin')
@UseGuards(AuthGuard)
export class AdminDashboardController {
  private readonly logger = new Logger(AdminDashboardController.name);
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('stats')
  @Authenticated({ admin: true })
  @ApiOperation({ summary: 'Get overall admin dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved dashboard statistics',
  })
  async getOverviewStats() {
    this.logger.log('Fetching overview stats');
    return this.dashboardService.getStats();
  }

  @Get('weekly-activity')
  @Authenticated({ admin: true })
  @ApiOperation({ summary: 'Get weekly quiz activity data' })
  async getWeeklyActivity() {
    return this.dashboardService.getWeeklyActivity();
  }

  @Get('category-distribution')
  @Authenticated({ admin: true })
  @ApiOperation({ summary: 'Get distribution of quizzes by category' })
  async getCategoryDistribution() {
    return this.dashboardService.getCategoryDistribution();
  }

  @Get('activity-trend')
  @Authenticated({ admin: true })
  @ApiOperation({ summary: 'Get monthly activity trend' })
  async getActivityTrend() {
    return this.dashboardService.getActivityTrend();
  }
}
