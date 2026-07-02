import { Locker, Shelf } from '../../domain/entitites/shelf.entity';

export class ShelfMapper {
  static toDomain(model: any & { locker?: any }): Shelf {
    const folderCount = model._count?.folders ?? 0;
    return new Shelf(
      model.id,
      model.name || null,
      model.description,
      model.status,
      model.maxQty,
      model.lockerId,
      model.createdAt,
      model.updatedAt,
      model.maxQty - folderCount,
      model.locker
        ? new Locker(
          model.locker.id,
          model.locker.code,
          model.locker.name,
          model.locker.description,
          model.locker.status,
          model.locker.warehouseId,
          model.locker.warehouse,
        )
        : null,
    );
  }
}
