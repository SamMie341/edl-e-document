import { WarehouseModel } from '@prisma/client';
import {
  Department,
  Division,
  Locker,
  Warehouse,
} from '../../domain/entities/warehouse.entity';

export class WarehouseMapper {
  static toDomain(
    model: WarehouseModel & { department?: any; division?: any; lockers?: any[] },
  ): Warehouse {
    return new Warehouse(
      model.id,
      model.code,
      model.name,
      model.description,
      model.status,
      model.departmentId,
      model.divisionId,
      model.createdAt,
      model.updatedAt,
      model.department
        ? new Department(
          model.department.id,
          model.department.code,
          model.department.name,
        ) : null,
      model.division
        ? new Division(
          model.division.id,
          model.division.code,
          model.division.name,
          model.division.shortName,
        ) : null,
      model.lockers
        ? model.lockers.map(
          (locker) =>
            new Locker(
              locker.id,
              locker.code,
              locker.name,
              locker.description,
            ),
        )
        : [],
    );
  }
}
