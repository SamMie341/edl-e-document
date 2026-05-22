import { Warehouse } from './../../domain/entities/warehouse.entity';
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { WarehouseFilterParams, IWarehouseRepository } from "../../domain/repositories/warehouse.repository.interface";
import { PrismaService } from "src/core/database/prisma.service";
import { WarehouseMapper } from "../mappers/warehouse.mapper";

@Injectable()
export class PrismaWarehouseRepository implements IWarehouseRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(params: WarehouseFilterParams): Promise<{ data: Warehouse[]; total: number }> {
        const { page = 1, limit = 10, search, branchId, status } = params;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;
        if (branchId) where.branchId = branchId;
        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [models, total] = await Promise.all([
            this.prisma.warehouseModel.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.warehouseModel.count({ where }),
        ]);

        return { data: models.map(WarehouseMapper.toDomain), total };
    }

    async create(data: any): Promise<Warehouse> {
        const existing = await this.prisma.warehouseModel.findUnique({
            where: { code: data.code }
        });
        if (existing) {
            throw new ConflictException(`ລະຫັດສາງ ${data.code} ຖືກໃຊ້ງານແລ້ວ`);
        }
        const model = await this.prisma.warehouseModel.create({ data });
        return WarehouseMapper.toDomain(model);
    }

    async findByBranchId(branchId: number): Promise<Warehouse[]> {
        const models = await this.prisma.warehouseModel.findMany({
            where: { branchId: Number(branchId), status: 'A' },
            orderBy: { code: 'asc' },
            include: {
                branch: {
                    include: { divisions: true, addresses: true }
                }
            }
        });
        return models.map(model => WarehouseMapper.toDomain(model));
    }

    async update(id: string, data: any): Promise<Warehouse> {
        const existing = await this.prisma.warehouseModel.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບສາງນີ້ໃນລະບົບ');
        }
        const model = await this.prisma.warehouseModel.update({ where: { id }, data });
        return WarehouseMapper.toDomain(model);
    }

    async delete(id: string): Promise<void> {
        const existing = await this.prisma.warehouseModel.findUnique({ where: { id } });
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບສາງນີ້ໃນລະບົບ');
        }
        await this.prisma.warehouseModel.delete({ where: { id } });
    }
}