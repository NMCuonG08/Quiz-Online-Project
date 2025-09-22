import { Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { BaseRepository } from '@/common/base/base.repository';

@Injectable()
export class CategoryRepository extends BaseRepository<Category> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.category;
  }

  async findByName(name: string) {
    return this.model.findFirst({ where: { name } });
  }
}
