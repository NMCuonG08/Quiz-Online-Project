import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { BaseRepository } from '@/common/base/base.repository';
import { QuizRoom, RoomParticipant } from '@prisma/client';

@Injectable()
export class RoomRepository extends BaseRepository<QuizRoom> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.quizRoom;
  }

  findByCode(room_code: string): Promise<QuizRoom | null> {
    return this.model.findUnique({ where: { room_code } });
  }

  findParticipants(room_id: string): Promise<RoomParticipant[]> {
    return this.prisma.roomParticipant.findMany({
      where: { room_id },
      orderBy: { joined_at: 'asc' },
    });
  }
}
