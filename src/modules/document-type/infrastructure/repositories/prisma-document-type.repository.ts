import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { IDocumentTypeRepository } from '../../domain/repositories/document-type.repository.interface';
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

    async findAll(skip?: number, take?: number): Promise<{ data: DocumentType[], total: number }> {
        const [models, total] = await this.prisma.$transaction([
            this.prisma.documentTypeModel.findMany({
                skip, take,
                orderBy: { code: 'asc' },
            }),
            this.prisma.documentTypeModel.count()
        ]);
        return {
            data: models.map(DocumentTypeMapper.toDomain),
            total,
        }
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

    async delete(id: string): Promise<void> {
        await this.prisma.documentTypeModel.delete({ where: { id } });
    }
}
