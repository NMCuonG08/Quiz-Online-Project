export interface IBaseMapper<Entity, DTO> {
  toDTO(entity: Entity): DTO;
  toEntity(dto: DTO): Entity;
  toDTOArray(entities: Entity[]): DTO[];
  toEntityArray(dtos: DTO[]): Entity[];
}

export interface IBaseMapperWithPartial<
  Entity,
  DTO,
  CreateDTO = Partial<DTO>,
  UpdateDTO = Partial<DTO>,
> extends IBaseMapper<Entity, DTO> {
  fromCreateDTO(createDto: CreateDTO): Entity;
  fromUpdateDTO(updateDto: UpdateDTO, existingEntity?: Entity): Entity;
  toResponseDTO?(entity: Entity): DTO;
}
