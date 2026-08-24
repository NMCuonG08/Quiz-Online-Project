import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { AuthGuard, Authenticated } from '@/common/guards/auth.guard';

@ApiTags('Admin')
@Controller('/api/admin/audit-events')
@UseGuards(AuthGuard)
export class AuditEventsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Authenticated({ admin: true })
  @ApiOperation({ summary: 'List recent auditable events for administrators' })
  async list(
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('resource_type') resourceType?: string,
  ) {
    const take = Math.max(1, Math.min(Number(limit) || 50, 200));
    return this.prisma.activityLog.findMany({
      where: {
        ...(action ? { action } : {}),
        ...(resourceType ? { resource_type: resourceType } : {}),
      },
      select: {
        id: true, action: true, resource_type: true, resource_id: true,
        details: true, created_at: true, user_id: true,
      },
      orderBy: { created_at: 'desc' },
      take,
    });
  }
}
