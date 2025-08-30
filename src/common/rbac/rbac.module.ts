import { Module } from '@nestjs/common';
import { RbacService } from '../services/rbac.service';
import { RbacController } from '../controllers/rbac.controller';

@Module({
  imports: [],
  providers: [RbacService],
  controllers: [RbacController],
  exports: [RbacService],
})
export class RbacModule {}
