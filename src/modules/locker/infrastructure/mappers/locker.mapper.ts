import { LockerModel } from '@prisma/client';
import { Locker } from '../../domain/entities/locker.entity';
import { Warehouse, Department, Division } from '../../../warehouse/domain/entities/warehouse.entity';

export class LockerMapper {
  static toDomain(model: LockerModel & { warehouse?: any; _count?: { shelves: number }; shelves?: any[] }): Locker {
    const shelvesCount = model._count?.shelves ?? (model.shelves ? model.shelves.length : undefined);
    return new Locker(
      model.id,
      model.code,
      model.name,
      model.description,
      model.status,
      model.warehouseId,
      model.createdAt,
      model.updatedAt,
      shelvesCount,
      model.shelves?.map(s => ({ id: s.id, name: s.name })),
      model.warehouse
        ? new Warehouse(
          model.warehouse.id,
          model.warehouse.code,
          model.warehouse.name,
          model.warehouse.description,
          model.warehouse.status,
          model.warehouse.departmentId,
          model.warehouse.divisionId,
          model.warehouse.createdAt,
          model.warehouse.updatedAt,
          model.warehouse.department
            ? new Department(
              model.warehouse.department.id,
              model.warehouse.department.code,
              model.warehouse.department.name,
            )
            : null,
          model.warehouse.division
            ? new Division(
              model.warehouse.division.id,
              model.warehouse.division.code,
              model.warehouse.division.name,
              model.warehouse.division.shortName,
            )
            : null,
        )
        : null,
    );
  }
}

