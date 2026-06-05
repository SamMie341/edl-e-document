import { FolderModel, LockerModel, ShelfModel } from '@prisma/client';
import { Folder } from '../../domain/entities/folder.entity';

export class FolderMapper {
  static toDomain(model: FolderModel & { shelf?: ShelfModel | null; _count?: { documents: number } }): Folder {
    return new Folder(
      model.id,
      model.code,
      model.name,
      model.status,
      model.qrCode,
      model.locationRef,
      model.shelfId,
      model.createdAt,
      model.updatedAt,
      model.shelf ? {
        id: model.shelf.id,
        name: model.shelf.name,
        description: model.shelf.description,
        status: model.shelf.status,
        maxQty: model.shelf.maxQty,
        lockerId: model.shelf.lockerId,
      } : undefined,
      model._count?.documents,
    );
  }

  static toPersistence(entity: Folder): any {
    return {
      id: entity.id,
      folderCode: entity.code,
      contentName: entity.name,
      status: entity.status,
      qrCode: entity.qrCode,
      locationRef: entity.locationRef,
      shelfId: entity.shelfId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
