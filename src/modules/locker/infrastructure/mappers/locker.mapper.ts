import { LockerModel } from "@prisma/client";
import { Locker, Warehouse } from "../../domain/entities/locker.entity";

export class LockerMapper {
    static toDomain(model: LockerModel & { warehouse?: any; }): Locker {
        return new Locker(
            model.id,
            model.code,
            model.name,
            model.description,
            model.status,
            model.warehouseId,
            model.createdAt,
            model.updatedAt,
            model.warehouse ? new Warehouse(
                model.warehouse.id,
                model.warehouse.code,
                model.warehouse.name,
            ) : null
        );
    }
}