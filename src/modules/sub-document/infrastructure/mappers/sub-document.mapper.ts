import { SubDocumentEntity } from '../../domain/entities/sub-document.entity';

export class SubDocumentMapper {
  static toDomain(model: any): SubDocumentEntity {
    return new SubDocumentEntity(
      model.id,
      model.documentId,
      model.subDocNo,
      model.subDocDate,
      model.createdAt,
      model.updatedAt,
    );
  }
}
