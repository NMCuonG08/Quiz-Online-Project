import { Module } from '@nestjs/common';
import { RbacService } from '@/common/rbac/rbac.service';
import { RbacController } from '@/common/rbac/rbac.controller';

@Module({
  imports: [],
  providers: [RbacService],
  controllers: [RbacController],
  exports: [RbacService],
})
export class RbacModule {}
