import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { IFolderRepository } from '../../domain/repositories/folder.repository.interface';
import { Folder } from '../../domain/entities/folder.entity';
import { PrismaService } from 'src/core/database/prisma.service';
import { FolderMapper } from '../mappers/folder.mapper';

@Injectable()
export class PrismaFolderRepository implements IFolderRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(params?: {
        skip?: number;
        take?: number;
        shelfId?: string;
        addressId?: string;
        search?: string;
    }): Promise<{ data: Folder[]; total: number }> {
        const { skip, take, shelfId, addressId, search } = params || {};

        const where: any = {};
        if (shelfId) where.shelfId = shelfId;

        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (addressId) {
            where.shelf = {
                is: { locker: { is: { warehouse: { is: { addressId } } } } },
            };
        }

        const [models, total] = await this.prisma.$transaction([
            this.prisma.folderModel.findMany({
                where,
                skip,
                take,
                orderBy: { code: 'asc' },
                include: {
                    _count: { select: { documents: true } }
                },
            }),
            this.prisma.folderModel.count({ where }),
        ]);
        return { data: models.map(FolderMapper.toDomain), total };
    }

    async create(data: any): Promise<Folder> {
        const code: string = data.code;

        // ─── ตรวจ duplicate ───────────────────────────────────────────────────
        const existing = await this.prisma.folderModel.findUnique({
            where: { code },
            include: { _count: { select: { documents: true } } },
        });
        if (existing) {
            throw new ConflictException(`ລະຫັດໂກໂນ '${code}' ຖືກໃຊ້ງານແລ້ວ`);
        }

        // ─── ดึง shelf เพื่อสร้าง locationRef ───────────────────────────────
        const shelf = await this.prisma.shelfModel.findUnique({
            where: { id: data.shelfId },
            include: {
                locker: {
                    include: { warehouse: { include: { address: true } } }
                },
            },
        });

        if (!shelf) throw new NotFoundException('ບໍ່ພົບຊັ້ນວາງໃນລະບົບ');

        const locationRef = `${shelf.locker.warehouse?.address?.code ?? ''}/${shelf.locker?.warehouse?.code ?? ''}/${shelf.locker?.code ?? ''}`;
        const qrCode = data.qrCode?.trim() || `${locationRef}`;

        const model = await this.prisma.folderModel.create({
            data: {
                ...data,
                code,
                locationRef,
                qrCode,
            },
        });
        return FolderMapper.toDomain(model);
    }

    async findById(id: string): Promise<Folder> {
        const model = await this.prisma.folderModel.findUnique({
            where: { id },
            include: {
                shelf: true,
                documents: true,
                _count: { select: { documents: true } },
            },
        });
        if (!model) throw new NotFoundException('ບໍ່ພົບໂກໂນນີ້ໃນລະບົບ');
        return FolderMapper.toDomain(model);
    }

    async findByShelfId(shelfId: string): Promise<Folder[]> {
        const models = await this.prisma.folderModel.findMany({
            where: { shelfId, status: 'A' },
            orderBy: { code: 'asc' },
            include: { _count: { select: { documents: true } } },
        });
        return models.map((model) => FolderMapper.toDomain(model));
    }

    async update(id: string, data: any): Promise<Folder> {
        const existing = await this.prisma.folderModel.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບໂກໂນນີ້ໃນລະບົບ');
        }

        // ตรวจ code ซ้ำ (ถ้าเปลี่ยน code)
        if (data.code && data.code !== existing.code) {
            const codeExists = await this.prisma.folderModel.findUnique({
                where: { code: data.code },
            });
            if (codeExists) {
                throw new ConflictException(`ລະຫັດໂກໂນ '${data.code}' ຖືກໃຊ້ງານແລ້ວ`);
            }
        }

        const model = await this.prisma.folderModel.update({ where: { id }, data });
        return FolderMapper.toDomain(model);
    }

    async delete(id: string): Promise<void> {
        const existing = await this.prisma.folderModel.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບໂກໂນນີ້ໃນລະບົບ');
        }
        await this.prisma.folderModel.delete({ where: { id } });
    }
}
