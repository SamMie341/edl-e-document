import { LockerModel } from '@prisma/client';
import { Locker } from '../../domain/entities/locker.entity';
import { Warehouse, Address } from '../../../warehouse/domain/entities/warehouse.entity';

export class LockerMapper {
  static toDomain(model: LockerModel & { warehouse?: any }): Locker {
    return new Locker(
      model.id,
      model.code,
      model.name,
      model.description,
      model.status,
      model.warehouseId,
      model.createdAt,
      model.updatedAt,
      model.warehouse
        ? new Warehouse(
            model.warehouse.id,
            model.warehouse.code,
            model.warehouse.name,
            model.warehouse.description,
            model.warehouse.status,
            model.warehouse.addressId,
            model.warehouse.createdAt,
            model.warehouse.updatedAt,
            model.warehouse.address
              ? new Address(
                  model.warehouse.address.id,
                  model.warehouse.address.code,
                  model.warehouse.address.name,
                  model.warehouse.address.details,
                  model.warehouse.address.status,
                  model.warehouse.address.departmentId,
                  model.warehouse.address.divisionId,
                )
              : null,
          )
        : null,
    );
  }
}
