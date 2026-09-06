import { Module } from '@nestjs/common';
import { MessagingController } from './controllers/messaging.controller';
import { MessagingService } from './services/messaging.service';
import { CommonRepositoriesModule } from '@/common/repositories/common-repositories.module';
import { PrismaModule } from '@/infrastructure/database/prisma.module';
import { GuardsModule } from '@/common/guards/guards.module';

@Module({ imports: [PrismaModule, CommonRepositoriesModule, GuardsModule], controllers: [MessagingController], providers: [MessagingService], exports: [MessagingService] })
export class MessagingModule {}
