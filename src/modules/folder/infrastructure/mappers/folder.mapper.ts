import { DocumentModel, FolderModel, ShelfModel } from '@prisma/client';
import { Folder } from '../../domain/entities/folder.entity';

export class FolderMapper {
  static toDomain(model: FolderModel & { shelf?: any; _count?: { documents: number }; documents?: DocumentModel[] }): Folder {
    return new Folder(
      model.id,
      model.code,
      model.name,
      model.status,
      model.qrCode,
      model.locationRef,
      model.description,
      model.shelfId,
      model.createdAt,
      model.updatedAt,
      model.shelf ? {
        id: model.shelf.id,
        name: model.shelf.name,
        description: model.shelf.description,
        status: model.shelf.status,
        maxQty: model.shelf.maxQty,
        // lockerId: model.shelf.lockerId,
        locker: model.shelf.locker ? {
          id: model.shelf.locker.id,
          code: model.shelf.locker.code,
          name: model.shelf.locker.name,
          description: model.shelf.locker.description,
          status: model.shelf.locker.status,
          warehouse: model.shelf.locker.warehouse ? {
            id: model.shelf.locker.warehouse.id,
            code: model.shelf.locker.warehouse.code,
            name: model.shelf.locker.warehouse.name,
            description: model.shelf.locker.warehouse.description,
            status: model.shelf.locker.warehouse.status,
            address: model.shelf.locker.warehouse.address ? {
              id: model.shelf.locker.warehouse.address.id,
              code: model.shelf.locker.warehouse.address.code,
              name: model.shelf.locker.warehouse.address.name,
              details: model.shelf.locker.warehouse.address.details,
              status: model.shelf.locker.warehouse.address.status,
              division: model.shelf.locker.warehouse.address.division ? {
                id: model.shelf.locker.warehouse.address.division.id,
                code: model.shelf.locker.warehouse.address.division.code,
                name: model.shelf.locker.warehouse.address.division.name,
                status: model.shelf.locker.warehouse.address.division.status,
              } : null,
            } : null,
          } : null,
        } : null,
      } : undefined,
      model.documents?.map((doc) => ({
        id: doc.id,
        docNo: doc.docNo,
        shortName: doc.shortName,
        docDate: doc.docDate,
        subDocNo: doc.subDocNo,
        subDocDate: doc.subDocDate,
        title: doc.title,
        description: doc.description,
        docExpire: doc.docExpire,
        qrCode: doc.qrCode,
        isContractBound: doc.isContractBound,
      })),
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
