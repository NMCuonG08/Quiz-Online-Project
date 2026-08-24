import { Module } from '@nestjs/common';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AuditEventsController } from './controllers/audit-events.controller';
import { GuardsModule } from '@/common/guards/guards.module';

@Module({
  imports: [GuardsModule],
  controllers: [AdminDashboardController, AuditEventsController],
  providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
