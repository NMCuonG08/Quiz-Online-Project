import { Module } from '@nestjs/common';
import { BaseModule } from '@/common/base/base.module';
import { RoomController } from './controllers/room.controller';
import { RoomService } from './services/room.service';
import { RoomRepository } from './repositories/room.repository';

@Module({
  imports: [BaseModule],
  controllers: [RoomController],
  providers: [RoomService, RoomRepository],
  exports: [RoomService],
})
export class RoomPlayModule {}
