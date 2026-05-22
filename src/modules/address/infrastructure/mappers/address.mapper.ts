import { AddressModel, DivisionModel } from "@prisma/client";
import { Address } from "../../domain/entities/address.entity";

export class AddressMapper {
    static toDomain(model: AddressModel & { division?: DivisionModel | null }): Address {
        return new Address(
            model.id,
            model.code,
            model.name,
            model.details,
            model.status,
            model.branchId,
            model.divisionId,
            model.createdAt,
            model.updatedAt,
        );
    }
}