import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { LockerFilterParams, ILockerRepository } from "../../domain/repositories/locker.repository.interface";
import { Locker } from "../../domain/entities/locker.entity";
import { PrismaService } from "src/core/database/prisma.service";
import { LockerMapper } from "../mappers/locker.mapper";

@Injectable()
export class PrismaLockerRepository implements ILockerRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(params: LockerFilterParams): Promise<{ data: Locker[]; total: number }> {
        const { page = 1, limit = 10, search, warehouseId, branchId, divisionId, status } = params;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;

        // Build warehouse relation filter
        // ใช้ `warehouse: { is: { ... } }` เพื่อ:
        //  1. บังคับว่าต้องมี warehouse (ไม่ใช่ null)
        //  2. warehouse ต้องตรงกับ branchId/divisionId ของ user
        if (branchId || divisionId || warehouseId) {
            const warehouseFilter: any = {};

            if (warehouseId) warehouseFilter.id = warehouseId;
            if (branchId) warehouseFilter.branchId = branchId;
            if (divisionId) warehouseFilter.divisionId = divisionId;

            // `is` → locker ต้องมี warehouse และ warehouse ต้องตรงทุก condition
            where.warehouse = { is: warehouseFilter };
        }

        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [models, total] = await Promise.all([
            this.prisma.lockerModel.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { warehouse: true },
            }),
            this.prisma.lockerModel.count({ where }),
        ]);

        return { data: models.map(LockerMapper.toDomain), total };
    }

    async findByWarehouseId(warehouseId: string): Promise<Locker[]> {
        const models = await this.prisma.lockerModel.findMany({
            where: { warehouseId, status: 'A' },
            orderBy: { code: 'asc' },
        });
        return models.map(LockerMapper.toDomain);
    }

    async create(data: any): Promise<Locker> {
        const existing = await this.prisma.lockerModel.findUnique({
            where: { code: data.code }
        });
        if (existing) {
            throw new ConflictException(`ລະຫັດຕູ້ '${data.code}' ຖືກໃຊ້ງານແລ້ວ`);
        }
        const model = await this.prisma.lockerModel.create({ data });
        return LockerMapper.toDomain(model);
    }

    async update(id: string, data: any): Promise<Locker> {
        const existing = await this.prisma.lockerModel.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບຕູ້ Locker ນີ້ໃນລະບົບ');
        }
        const model = await this.prisma.lockerModel.update({ where: { id }, data });
        return LockerMapper.toDomain(model);
    }

    async delete(id: string): Promise<void> {
        const existing = await this.prisma.lockerModel.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບຕູ້ Locker ນີ້ໃນລະບົບ');
        }
        await this.prisma.lockerModel.delete({ where: { id } });
    }
}
