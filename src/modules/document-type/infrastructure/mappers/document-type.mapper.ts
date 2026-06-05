import { DocumentTypeModel } from '@prisma/client';
import { DocumentType } from '../../domain/entities/document-type.entity';

export class DocumentTypeMapper {
  static toDomain(model: DocumentTypeModel): DocumentType {
    return new DocumentType(
      model.id,
      model.code,
      model.name,
      model.description,
      model.createdAt,
      model.updatedAt,
    );
  }

  static toPersistence(entity: DocumentType): any {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      description: entity.description,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
