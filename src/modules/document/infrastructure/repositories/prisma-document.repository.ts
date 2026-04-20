import { Injectable } from '@nestjs/common';
import { IDocumentRepository } from '../../domain/repositories/document.repository.interface';
import { Document } from '../../domain/entities/document.entity';
import { DocumentMapper } from '../mappers/document.mapper';
import { PrismaService } from 'src/core/database/prisma.service';
import { PaginatedResult } from 'src/core/interfaces/paginated-result.interface';

@Injectable()
export class PrismaDocumentRepository implements IDocumentRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findManyWithPagination(whereClause: any, page: number, limit: number): Promise<PaginatedResult<Document>> {
        const skip = (page - 1) * limit;

        const [total, models] = await this.prisma.$transaction([
            this.prisma.documentModel.count({ where: whereClause }),
            this.prisma.documentModel.findMany({
                where: whereClause,
                skip: skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
        ]);

        return {
            data: models.map(DocumentMapper.toDomain),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        }
    }

    async save(document: Document): Promise<void> {
        const data = DocumentMapper.toPersistence(document);

        await this.prisma.documentModel.upsert({
            where: { id: data.id },
            update: data,
            create: data,
        });
    }

    async findById(id: string): Promise<Document | null> {
        const model = await this.prisma.documentModel.findUnique({
            where: { id },
        });

        if (!model) return null;

        return DocumentMapper.toDomain(model);
    }

    async findAll(): Promise<Document[]> {
        const models = await this.prisma.documentModel.findMany();
        return models.map(model => DocumentMapper.toDomain(model));
    }
}