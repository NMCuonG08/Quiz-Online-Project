import { Module } from '@nestjs/common';
import { RbacService } from '@/common/services/rbac.service';
import { RbacController } from '@/common/controllers/rbac.controller';

@Module({
  imports: [],
  providers: [RbacService],
  controllers: [RbacController],
  exports: [RbacService],
})
export class RbacModule {}
