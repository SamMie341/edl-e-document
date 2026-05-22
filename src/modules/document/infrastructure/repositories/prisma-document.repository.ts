import { ConflictException, Injectable } from '@nestjs/common';
import { DocumentFilterParams, IDocumentRepository } from '../../domain/repositories/document.repository.interface';
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

    async findAll(params: DocumentFilterParams): Promise<{ data: DocumentEntity[]; total: number; }> {
        const { page = 1, limit = 10, status, documentTypeId, startDate, endDate, search, branchId } = params;
        const skip = (page - 1) * limit;
        const whereCondition: any = {};
        if (branchId) {
            whereCondition.branchId = branchId;
        }

        if (status) whereCondition.status = status;
        if (documentTypeId) whereCondition.documentTypeId = Number(documentTypeId);
        if (startDate || endDate) {
            whereCondition.createdAt = {};
            if (startDate) {
                whereCondition.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
            }
            if (endDate) {
                whereCondition.createAt.lte = new Date(`${endDate}T23:59:59.999Z`);
            }
        }
        if (search) {
            whereCondition.OR = [
                { docNo: { contains: search, mode: 'insensitive' } },
                { title: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [models, total] = await this.prisma.$transaction([
            this.prisma.documentModel.findMany({
                skip, take: limit,
                include: { documentType: true, folder: true },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.documentModel.count({ where: whereCondition })
        ]);
        return { data: models.map(model => DocumentMapper.toDomain(model)), total };
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