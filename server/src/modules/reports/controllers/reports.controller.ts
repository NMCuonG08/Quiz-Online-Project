import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from '../services/reports.service';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
// import { AuthGuard, Authenticated } from '@/common/guards/auth.guard';
// import { Permission } from '@/common/enums/permisson';

@Controller('api/admin/reports')
@ApiTags('Admin Reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('export')
  // @UseGuards(AuthGuard)
  // @Authenticated({ permission: Permission.AdminUserRead }) // Bắt buộc user phải có quyền Admin
  @ApiOperation({ summary: 'Export data to Excel' })
  @ApiQuery({ name: 'type', enum: ['users', 'quizzes', 'attempts'], required: true })
  async exportReport(@Query('type') type: string, @Res() res: Response) {
    let buffer: Buffer;
    let prefix = 'report';

    try {
      if (type === 'users') {
        buffer = await this.reportsService.exportUsersReport();
        prefix = 'users';
      } else if (type === 'quizzes') {
        buffer = await this.reportsService.exportQuizzesReport();
        prefix = 'quizzes';
      } else if (type === 'attempts') {
        buffer = await this.reportsService.exportAttemptsReport();
        prefix = 'attempts';
      } else {
        return res.status(400).json({ success: false, message: 'Invalid export type.' });
      }

      const filename = `${prefix}_${new Date().toISOString().split('T')[0]}.xlsx`;

      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        // IMPORTANT: Expose header to let frontend read the filename if needed
        'Access-Control-Expose-Headers': 'Content-Disposition',
      });

      res.end(buffer);
    } catch (error) {
      console.error('Export Error:', error);
      res.status(500).json({ success: false, message: 'Failed to generate report.' });
    }
  }
}
