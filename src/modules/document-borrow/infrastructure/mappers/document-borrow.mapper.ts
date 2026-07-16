import { DocumentBorrowEntity } from '../../domain/entities/document-borrow.entity';

export class DocumentBorrowMapper {
  static toDomain(model: any): DocumentBorrowEntity {
    return new DocumentBorrowEntity(
      model.id,
      model.documentId,
      model.folderId,
      model.borrower,       // scalar String
      model.phone,          // scalar String?
      model.borrowedAt,
      model.returnedAt,
      model.dueDate,        // DateTime?
      model.purpose,
      model.toDivisionId,
      model.toLocation,
      model.createdById,
      model.note,
      model.status,         // scalar String
      model.createdAt,
      model.updatedAt,
      model.document,
      model.folder,
      model.toDivision,
      model.createdBy,
    );
  }
}
