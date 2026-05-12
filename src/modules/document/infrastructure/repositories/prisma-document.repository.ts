import { ConflictException, Injectable } from '@nestjs/common';
import { IDocumentRepository } from '../../domain/repositories/document.repository.interface';
import { PrismaService } from 'src/core/database/prisma.service';
import { DocumentEntity } from '../../domain/entities/document.entity';
import { DocumentMapper } from '../mappers/document.mapper';

@Injectable()
export class PrismaDocumentRepository implements IDocumentRepository {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: any): Promise<DocumentEntity> {
        const existing = await this.prisma.documentModel.findFirst({
            where: { docNo: data.docNo }
        });
        if (existing) {
            throw new ConflictException(`ເລກທີ່ເອກະສານ '${data.docNo}' ມີຢູ່ໃນລະບົບແລ້ວ`);
        }

        const { attachments, ...documentData } = data;

        const model = await this.prisma.documentModel.create({
            data: {
                ...documentData,
                attachments: attachments && attachments.length > 0 ? {
                    create: attachments,
                } : undefined
            },
            include: {
                attachments: true,
                folder: true,
                documentType: true,
            }
        });
        return DocumentMapper.toDomain(model);
    }

    async findAll(skip?: number, take?: number): Promise<{ data: DocumentEntity[]; total: number; }> {
        const [models, total] = await this.prisma.$transaction([
            this.prisma.documentModel.findMany({
                skip, take,
                orderBy: { createdAt: 'desc' },
                include: { documentType: true, folder: true }
            }),
            this.prisma.documentModel.count()
        ]);
        return { data: models.map(DocumentMapper.toDomain), total };
    }

    async findById(id: string): Promise<DocumentEntity | null> {
        const model = await this.prisma.documentModel.findUnique({
            where: { id },
            include: { attachments: true, documentType: true, folder: true, user: true }
        });
        if (!model) return null;
        return DocumentMapper.toDomain(model);
    }


}