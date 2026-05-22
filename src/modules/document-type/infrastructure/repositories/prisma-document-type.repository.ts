import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { DocumentTypeFilterParams, IDocumentTypeRepository } from '../../domain/repositories/document-type.repository.interface';
import { DocumentType } from '../../domain/entities/document-type.entity';
import { DocumentTypeMapper } from '../mappers/document-type.mapper';

@Injectable()
export class PrismaDocumentTypeRepository implements IDocumentTypeRepository {
    constructor(private readonly prisma: PrismaService) { }

    async create(data: any): Promise<DocumentType> {
        const existing = await this.prisma.documentTypeModel.findFirst({
            where: {
                OR: [
                    { name: data.name },
                    { code: data.code },
                ]
            }
        });

        if (existing) {
            throw new ConflictException(`ລະຫັດ ຫຼື ຊື່ປະເພດເອກະສານນີ້ມີຢູ່ໃນລະບົບແລ້ວ`);
        }

        const model = await this.prisma.documentTypeModel.create({ data });
        return DocumentTypeMapper.toDomain(model);
    }

    async findAll(params: DocumentTypeFilterParams): Promise<{ data: DocumentType[]; total: number }> {
        const { page = 1, limit = 100, search, status } = params;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [models, total] = await Promise.all([
            this.prisma.documentTypeModel.findMany({
                where,
                skip,
                take: limit,
                orderBy: { code: 'asc' },
            }),
            this.prisma.documentTypeModel.count({ where }),
        ]);

        return { data: models.map(DocumentTypeMapper.toDomain), total };
    }

    async findById(id: string): Promise<DocumentType | null> {
        const model = await this.prisma.documentTypeModel.findUnique({ where: { id } });
        return model ? DocumentTypeMapper.toDomain(model) : null;
    }

    async findByName(name: string): Promise<DocumentType | null> {
        const model = await this.prisma.documentTypeModel.findUnique({ where: { name } });
        if (!model) return null;
        return DocumentTypeMapper.toDomain(model);
    }

    async update(id: string, data: any): Promise<DocumentType> {
        const existing = await this.prisma.documentTypeModel.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບປະເພດເອກະສານນີ້ໃນລະບົບ');
        }
        const model = await this.prisma.documentTypeModel.update({ where: { id }, data });
        return DocumentTypeMapper.toDomain(model);
    }

    async delete(id: string): Promise<void> {
        const existing = await this.prisma.documentTypeModel.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບປະເພດເອກະສານນີ້ໃນລະບົບ');
        }
        await this.prisma.documentTypeModel.delete({ where: { id } });
    }
}
