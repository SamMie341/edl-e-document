import { FolderModel } from '@prisma/client';
import { Folder } from '../../domain/entities/folder.entity';

export class FolderMapper {
  static toDomain(model: FolderModel): Folder {
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
