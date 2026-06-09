import { AttachmentModel } from '@prisma/client';
import { DocumentEntity } from '../../domain/entities/document.entity';


export class DocumentMapper {
  static toDomain(model: any & { attachments?: AttachmentModel[] }): DocumentEntity {
    return new DocumentEntity(
      model.id,
      model.docNo,
      model.shortName,
      model.docDate,
      model.subDocNo,
      model.subDocDate,
      model.title,
      model.description || '',
      model.docExpire,
      model.qrCode,
      model.userId,
      model.folderId,
      model.documentTypeId,
      model.createdAt,
      model.updatedAt,
      (model.attachments ?? []).map((att: AttachmentModel) => ({
        id: att.id,
        fileName: att.fileName,
        filePath: att.filePath,
        mimeType: att.mimeType,
        size: att.size,
        documentId: att.documentId,
        createdAt: att.createdAt,
      })),
      model.isContractBound ?? false,
    );
  }

  // แปลงจาก Domain Entity -> Database Model (เพื่อนำไป save)
  // static toPersistence(domainEntity: Document): any {
  //     return {
  //         id: domainEntity.id,
  //         title: domainEntity.title,
  //         content: domainEntity.content,
  //         status: domainEntity.status,
  //         creatorId: domainEntity.userId,
  //         createdAt: domainEntity.createdAt,
  //         updatedAt: domainEntity.updatedAt,
  //     }
  // }
}
