import { BranchModel } from "@prisma/client";
import { Branch } from "../../domain/entities/branch.entity";

export class BranchMapper {
    static toDomain(model: BranchModel): Branch {
        return new Branch(
            model.code || '',
            model.name,
            model.status || '',
            model.createdAt,
            model.updatedAt,
        )
    }

    static toPersistence(entity: Branch): any {
        return {
            name: entity.name,
            address: entity.status,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}