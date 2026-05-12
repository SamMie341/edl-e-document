import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { IFolderRepository } from "../../domain/repositories/folder.repository.interface";
import { Folder } from "../../domain/entities/folder.entity";
import { PrismaService } from "src/core/database/prisma.service";
import { FolderMapper } from "../mappers/folder.mapper";

@Injectable()
export class PrismaFolderRepository implements IFolderRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(skip?: number, take?: number): Promise<{ data: Folder[]; total: number; }> {
        const [models, total] = await this.prisma.$transaction([
            this.prisma.folderModel.findMany({
                skip, take,
                orderBy: { code: 'asc' }
            }),
            this.prisma.folderModel.count()
        ]);
        return { data: models.map(FolderMapper.toDomain), total };
    }

    async create(data: any): Promise<Folder> {
        const existing = await this.prisma.folderModel.findUnique({
            where: { code: data.code }
        });
        if (existing) {
            throw new ConflictException(`ລະຫັດໂກໂນ ${data.folderCode} ຖືກໃຊ້ງານແລ້ວ`)
        }

        const shelf = await this.prisma.shelfModel.findUnique({
            where: { id: data.shelfId },
            include: {
                locker: {
                    include: { warehouse: { include: { address: true } } }
                }
            }
        });

        if (!shelf) throw new NotFoundException('ບໍ່ພົບຊັ້ນວາງໃນລະບົບ');

        const locationRef = `${shelf.locker.warehouse?.address?.code}/${shelf?.locker?.warehouse?.code}/${shelf?.locker.code}`;

        const qrCode = data.qrCode || `QR-${data.code}`;

        const model = await this.prisma.folderModel.create({
            data: {
                ...data,
                locationRef,
                qrCode,
            }
        });
        return FolderMapper.toDomain(model);
    }

    async findByShelfId(shelfId: string): Promise<Folder[]> {
        const models = await this.prisma.folderModel.findMany({
            where: { shelfId, status: 'A' },
            orderBy: { code: 'asc' }
        });
        return models.map(model => FolderMapper.toDomain(model));
    }

    async delete(id: string): Promise<void> {
        await this.prisma.folderModel.delete({ where: { id } });
    }
}