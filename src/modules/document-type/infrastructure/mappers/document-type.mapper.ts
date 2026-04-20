import { DocumentTypeModel } from '@prisma/client';
import { DocumentType } from '../../domain/entities/document-type.entity';

export class DocumentTypeMapper {
    static toDomain(model: DocumentTypeModel): DocumentType {
        return new DocumentType(
            model.id,
            model.name,
            model.description,
            model.isActive,
            model.createdAt,
            model.updatedAt,
        );
    }

    static toPersistence(entity: DocumentType): any {
        return {
            id: entity.id,
            name: entity.name,
            description: entity.description,
            isActive: entity.isActive,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
        };
    }
}
