import { BranchModel } from "@prisma/client";
import { Branch } from "../../domain/entities/branch.entity";

export class BranchMapper {
    static toDomain(model: BranchModel): Branch {
        return new Branch(
            model.id,
            model.name,
            model.address,
            model.createdAt,
            model.updatedAt,
        )
    }

    static toPersistence(entity: Branch): any {
        return {
            id: entity.id,
            name: entity.name,
            address: entity.address,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}