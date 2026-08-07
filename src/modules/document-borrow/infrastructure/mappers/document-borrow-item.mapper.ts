import { DocumentBorrowItemEntity } from '../../domain/entities/document-borrow.entity';

export class DocumentBorrowItemMapper {
  static toDomain(model: any): DocumentBorrowItemEntity {
    return new DocumentBorrowItemEntity(
      model.id,
      model.borrowId,
      model.documentId,
      model.folderId,
      model.returnedAt,
      model.status,
      model.note,
      model.createdAt,
      model.updatedAt,
      model.document,
      model.folder,
    );
  }
}
