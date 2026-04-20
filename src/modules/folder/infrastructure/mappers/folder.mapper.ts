import { FolderModel } from "@prisma/client";
import { Folder } from "../../domain/entities/folder.entity";

export class FolderMapper {
    static toDomain(model: FolderModel): Folder {
        return new Folder(
            model.id,
            model.name,
            model.description,
            model.branchId,
            model.createdAt,
            model.updatedAt,
        );
    }

    static toPersistence(entity: Folder): any {
        return {
            id: entity.id,
            name: entity.name,
            description: entity.description,
            branchId: entity.branchId,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}