import { WarehouseModel } from '@prisma/client';
import {
  Address,
  Warehouse,
} from '../../domain/entities/warehouse.entity';

export class WarehouseMapper {
  static toDomain(
    model: WarehouseModel & { division?: any; address?: any },
  ): Warehouse {
    return new Warehouse(
      model.id,
      model.code,
      model.name,
      model.description,
      model.status,
      model.addressId,
      model.createdAt,
      model.updatedAt,
      model.address
        ? new Address(
          model.address.id,
          model.address.code,
          model.address.name,
          model.address.details,
          model.address.status,
          model.address.departmentId,
          model.address.divisionId,
        ) : null,
    );
  }
}
