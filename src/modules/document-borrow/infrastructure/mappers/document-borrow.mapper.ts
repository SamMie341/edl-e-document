import { DocumentBorrowEntity } from '../../domain/entities/document-borrow.entity';
import { DocumentBorrowItemMapper } from './document-borrow-item.mapper';

export class DocumentBorrowMapper {
  static toDomain(model: any): DocumentBorrowEntity {
    const items = Array.isArray(model.items)
      ? model.items.map((i: any) => DocumentBorrowItemMapper.toDomain(i))
      : [];

    return new DocumentBorrowEntity(
      model.id,
      model.borrower,       // scalar String
      model.phone,          // scalar String?
      model.borrowedAt,
      model.purpose,
      model.toDivisionId,
      model.toLocation,
      model.createdById,
      model.note,
      model.status,         // scalar String
      model.createdAt,
      model.updatedAt,
      items,
      model.toDivision,
      model.createdBy,
    );
  }
}
