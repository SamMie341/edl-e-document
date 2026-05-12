import { Warehouse } from './../../domain/entities/warehouse.entity';
import { ConflictException, Injectable } from "@nestjs/common";
import { IWarehouseRepository } from "../../domain/repositories/warehouse.repository.interface";
import { PrismaService } from "src/core/database/prisma.service";
import { WarehouseMapper } from "../mappers/warehouse.mapper";

@Injectable()
export class PrismaWarehouseRepository implements IWarehouseRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(skip?: number, take?: number): Promise<{ data: Warehouse[]; total: number; }> {
        const [models, total] = await this.prisma.$transaction([
            this.prisma.warehouseModel.findMany({
                skip, take,
                orderBy: { code: 'asc' },
            }),
            this.prisma.warehouseModel.count(),
        ]);
        return {
            data: models.map(WarehouseMapper.toDomain),
            total,
        }
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
            where: { branchId, status: 'A' },
            orderBy: { code: 'asc' },
            include: {
                branch: {
                    include: { divisions: true, addresses: true }
                }
            }
        });
        return models.map(model => WarehouseMapper.toDomain(model));
    }

}