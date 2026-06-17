import { DocumentBorrowEntity } from '../../domain/entities/document-borrow.entity';

export class DocumentBorrowMapper {
  static toDomain(model: any): DocumentBorrowEntity {
    return new DocumentBorrowEntity(
      model.id,
      model.documentId,
      model.folderId,
      model.borrowerId,
      model.borrowedAt,
      model.returnedAt,
      model.purpose,
      model.toDivisionId,
      model.toLocation,
      model.createdById,
      model.note,
      model.createdAt,
      model.updatedAt,
      model.borrower,
      model.document,
      model.folder,
      model.toDivision,
      model.createdBy,
    );
  }
}
