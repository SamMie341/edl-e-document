import { WarehouseModel } from "@prisma/client";
import { Address, Division, Warehouse } from "../../domain/entities/warehouse.entity";

export class WarehouseMapper {
    static toDomain(model: WarehouseModel & { division?: any; address?: any }): Warehouse {
        return new Warehouse(
            model.id,
            model.code,
            model.name,
            model.description,
            model.status,
            model.branchId,
            model.divisionId,
            model.addressId,
            model.createdAt,
            model.updatedAt,
            model.division
                ? new Division(
                    model.division.id,
                    model.division.code,
                    model.division.name,
                    model.division.shortName,
                    model.division.status,
                )
                : null,
            model.address
                ? new Address(
                    model.address.id,
                    model.address.code,
                    model.address.name,
                    model.address.details,
                    model.address.status,
                )
                : null,
        );
    }
}