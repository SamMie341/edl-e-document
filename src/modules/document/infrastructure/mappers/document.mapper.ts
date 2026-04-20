import { DocumentModel } from '@prisma/client';
import { Document } from '../../domain/entities/document.entity';
import { DocumentStatus } from '../../domain/value-objects/document-status.enum';

export class DocumentMapper {
    // แปลงจาก Database Model -> Domain Entity
    static toDomain(prismaModel: DocumentModel): Document {
        return new Document(
            prismaModel.id,
            prismaModel.title,
            prismaModel.content,
            prismaModel.status as DocumentStatus, // Casting string กลับเป็น Enum
            prismaModel.creatorId,
            prismaModel.branchId,
            prismaModel.folderId || '',
            prismaModel.createdAt,
            prismaModel.updatedAt,
        );
    }

    // แปลงจาก Domain Entity -> Database Model (เพื่อนำไป save)
    static toPersistence(domainEntity: Document): any {
        return {
            id: domainEntity.id,
            title: domainEntity.title,
            content: domainEntity.content,
            status: domainEntity.status,
            creatorId: domainEntity.creatorId,
            createdAt: domainEntity.createdAt,
            updatedAt: domainEntity.updatedAt,
        }
    }
}