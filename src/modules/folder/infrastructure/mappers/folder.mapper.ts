import { FolderModel } from "@prisma/client";
import { Folder } from "../../domain/entities/folder.entity";

export class FolderMapper {
    static toDomain(model: FolderModel): Folder {
        return new Folder(
            model.id,
            model.folderCode,
            model.contentName,
            model.createdAt,
            model.updatedAt,
        );
    }

    static toPersistence(entity: Folder): any {
        return {
            id: entity.id,
            name: entity.name,
            description: entity.description,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}