import { IBaseMapper } from './base.mapper.interface';

export abstract class BaseMapper<Entity, DTO> implements IBaseMapper<
  Entity,
  DTO
> {
  abstract toDTO(entity: Entity): DTO;
  abstract toEntity(dto: DTO): Entity;

  toDTOArray(entities: Entity[]): DTO[] {
    return entities?.map((entity) => this.toDTO(entity)) || [];
  }

  toEntityArray(dtos: DTO[]): Entity[] {
    return dtos?.map((dto) => this.toEntity(dto)) || [];
  }

  // Utility methods
  protected mapNullable<T, R>(
    value: T | null | undefined,
    mapper: (val: T) => R,
  ): R | null {
    return value ? mapper(value) : null;
  }

  protected mapArray<T, R>(
    array: T[] | null | undefined,
    mapper: (item: T) => R,
  ): R[] {
    return array?.map(mapper) || [];
  }
}
