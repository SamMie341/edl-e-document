import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { IDocumentTypeRepository } from '../../domain/repositories/document-type.repository.interface';
import { DocumentType } from '../../domain/entities/document-type.entity';
import { DocumentTypeMapper } from '../mappers/document-type.mapper';

@Injectable()
export class PrismaDocumentTypeRepository implements IDocumentTypeRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(): Promise<DocumentType[]> {
        const models = await this.prisma.documentTypeModel.findMany({
            orderBy: { name: 'asc' },
        });
        return models.map(DocumentTypeMapper.toDomain);
    }

    async findById(id: string): Promise<DocumentType | null> {
        const model = await this.prisma.documentTypeModel.findUnique({ where: { id } });
        if (!model) return null;
        return DocumentTypeMapper.toDomain(model);
    }

    async findByName(name: string): Promise<DocumentType | null> {
        const model = await this.prisma.documentTypeModel.findUnique({ where: { name } });
        if (!model) return null;
        return DocumentTypeMapper.toDomain(model);
    }

    async save(documentType: DocumentType): Promise<void> {
        const data = DocumentTypeMapper.toPersistence(documentType);
        await this.prisma.documentTypeModel.upsert({
            where: { id: data.id },
            update: data,
            create: data,
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.documentTypeModel.delete({ where: { id } });
    }
}
