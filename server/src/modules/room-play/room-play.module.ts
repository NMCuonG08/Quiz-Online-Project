import { Module } from '@nestjs/common';
import { BaseModule } from '@/common/base/base.module';
import { RoomController } from './controllers/room.controller';
import { RoomService } from './services/room.service';
import { RoomRepository } from './repositories/room.repository';
import { RoomWebSocketGateway } from './gateways/room-websocket.gateway';
import { GuardsModule } from '@/common/guards/guards.module';

@Module({
  imports: [BaseModule, GuardsModule],
  controllers: [RoomController],
  providers: [RoomService, RoomRepository, RoomWebSocketGateway],
  exports: [RoomService],
})
export class RoomPlayModule {}
