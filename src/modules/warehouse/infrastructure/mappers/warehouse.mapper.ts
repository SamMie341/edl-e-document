import { WarehouseModel } from "@prisma/client";
import { Warehouse } from "../../domain/entities/warehouse.entity";

export class WarehouseMapper {
    static toDomain(model: WarehouseModel): Warehouse {
        return new Warehouse(
            model.id,
            model.code,
            model.name,
            model.description,
            model.status,
            model.branchId,
            model.addressId,
            // model.departmentId,
            // model.divisionId,
            model.createdAt,
            model.updatedAt,
        );
    }
}