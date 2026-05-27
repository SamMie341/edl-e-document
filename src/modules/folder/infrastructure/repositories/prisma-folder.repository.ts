import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { IFolderRepository } from "../../domain/repositories/folder.repository.interface";
import { Folder } from "../../domain/entities/folder.entity";
import { PrismaService } from "src/core/database/prisma.service";
import { FolderMapper } from "../mappers/folder.mapper";

@Injectable()
export class PrismaFolderRepository implements IFolderRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(params?: { skip?: number; take?: number; shelfId?: string; branchId?: number; divisionId?: number; search?: string }): Promise<{ data: Folder[]; total: number; }> {
        const { skip, take, shelfId, branchId, divisionId, search } = params || {};

        const where: any = {};
        if (shelfId) where.shelfId = shelfId;

        // search ตาม code หรือ name
        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
            ];
        }

        // scope ตาม branch/division ผ่าน chain: folder→shelf→locker→warehouse
        if (branchId || divisionId) {
            const warehouseFilter: any = {};
            if (branchId) warehouseFilter.branchId = branchId;
            if (divisionId) warehouseFilter.divisionId = divisionId;
            where.shelf = { is: { locker: { is: { warehouse: { is: warehouseFilter } } } } };
        }

        const [models, total] = await this.prisma.$transaction([
            this.prisma.folderModel.findMany({
                where,
                skip, take,
                orderBy: { code: 'asc' }
            }),
            this.prisma.folderModel.count({ where })
        ]);
        return { data: models.map(FolderMapper.toDomain), total };
    }

    async create(data: any): Promise<Folder> {
        // ─── Auto-generate code ถ้าไม่ได้ส่งมา ────────────────────────────────
        let code: string = data.code;
        if (!code || code.trim() === '') {
            // ดึง code ล่าสุดที่เป็นตัวเลขล้วน เรียงจากมากไปน้อย
            const lastFolder = await this.prisma.folderModel.findFirst({
                where: { code: { not: undefined } },
                orderBy: { code: 'desc' },
                select: { code: true },
            });

            let nextNumber = 1;
            if (lastFolder) {
                const parsed = parseInt(lastFolder.code, 10);
                if (!isNaN(parsed)) {
                    nextNumber = parsed + 1;
                }
            }
            // zero-pad 3 หลัก: 001, 002, ... 999
            code = String(nextNumber).padStart(5, '0');
        }

        // ─── ตรวจ duplicate ───────────────────────────────────────────────────
        const existing = await this.prisma.folderModel.findUnique({ where: { code } });
        if (existing) {
            throw new ConflictException(`ລະຫັດໂກໂນ '${code}' ຖືກໃຊ້ງານແລ້ວ`);
        }

        // ─── ดึง shelf เพื่อสร้าง locationRef ───────────────────────────────
        const shelf = await this.prisma.shelfModel.findUnique({
            where: { id: data.shelfId },
            include: {
                locker: {
                    include: { warehouse: { include: { address: true } } }
                }
            }
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

    async update(id: string, data: any): Promise<Folder> {
        const existing = await this.prisma.folderModel.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບໂກໂນນີ້ໃນລະບົບ');
        }

        // ตรวจ code ซ้ำ (ถ้าเปลี่ยน code)
        if (data.code && data.code !== existing.code) {
            const codeExists = await this.prisma.folderModel.findUnique({ where: { code: data.code } });
            if (codeExists) {
                throw new ConflictException(`ລະຫັດໂກໂນ '${data.code}' ຖືກໃຊ້ງານແລ້ວ`);
            }
        }

        const model = await this.prisma.folderModel.update({ where: { id }, data });
        return FolderMapper.toDomain(model);
    }

    async delete(id: string): Promise<void> {
        const existing = await this.prisma.folderModel.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບໂກໂນນີ້ໃນລະບົບ');
        }
        await this.prisma.folderModel.delete({ where: { id } });
    }
}