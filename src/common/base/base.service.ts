import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { PaginationQueryDto } from '@/common/dtos/responses/base.response';
import { LoggingRepository } from '@/common/repositories/logging.repository';
import { CryptoRepository } from '@/common/repositories/crypto.repository';

@Injectable()
export abstract class BaseService {
  constructor(
    protected readonly repository: BaseRepository,
    protected readonly logger: LoggingRepository,
    protected cryptoRepository: CryptoRepository,
  ) {}

  async findAll(paginationDto: PaginationQueryDto) {
    return await this.repository.paginate(paginationDto);
  }

  async findOne(id: string) {
    const entity = await this.repository.findUnique({ id });
    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }
    return entity;
  }

  async create(createDto: unknown) {
    return await this.repository.create(createDto);
  }

  async update(id: string, updateDto: unknown) {
    await this.findOne(id); // Check if exists
    return await this.repository.update({ id }, updateDto);
  }

  async remove(id: string) {
    await this.findOne(id); // Check if exists
    return await this.repository.delete({ id });
  }
}
