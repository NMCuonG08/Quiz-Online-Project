import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { PaginationQueryDto } from '@/common/dtos/responses/base.response';

@Injectable()
export abstract class BaseRepository<T = any> {
  constructor(protected readonly prisma: PrismaService) {}

  protected abstract get model(): {
    findMany(args?: any): Promise<T[]>;
    findUnique(args: { where: any }): Promise<T | null>;
    findFirst(args: { where: any }): Promise<T | null>;
    create(args: { data: any }): Promise<T>;
    update(args: { where: any; data: any }): Promise<T>;
    delete(args: { where: any }): Promise<T>;
    count(args?: { where?: any }): Promise<number>;
  };

  async findMany(args?: any): Promise<T[]> {
    return await this.model.findMany(args);
  }

  async findUnique(where: any): Promise<T | null> {
    return await this.model.findUnique({ where });
  }

  async findFirst(where: any): Promise<T | null> {
    return await this.model.findFirst({ where });
  }

  async create(data: any): Promise<T> {
    return await this.model.create({ data });
  }

  async update(where: any, data: any): Promise<T> {
    return await this.model.update({ where, data });
  }

  async delete(where: any): Promise<T> {
    return await this.model.delete({ where });
  }

  async count(where?: any): Promise<number> {
    return await this.model.count({ where });
  }

  async paginate(paginationDto: PaginationQueryDto, where?: any) {
    const { page = 1, limit = 10, sortBy, sortOrder } = paginationDto;
    const skip = (page - 1) * limit;
    const take = limit;

    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : undefined;

    const dataPromise = this.model.findMany({
      where,
      skip,
      take,
      orderBy,
    });

    const totalPromise = this.model.count({ where });

    const [data, total] = await Promise.all([dataPromise, totalPromise]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
