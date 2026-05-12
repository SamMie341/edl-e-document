import { ConflictException, Injectable } from "@nestjs/common";
import { ILockerRepository } from "../../domain/repositories/locker.repository.interface";
import { Locker } from "../../domain/entities/locker.entity";
import { PrismaService } from "src/core/database/prisma.service";
import { LockerMapper } from "../mappers/locker.mapper";

@Injectable()
export class PrismaLockerRepository implements ILockerRepository {
    constructor(private readonly prisma: PrismaService) { }

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
    async findAll(skip?: number, take?: number): Promise<{ data: Locker[]; total: number; }> {

        const [models, total] = await this.prisma.$transaction([
            this.prisma.lockerModel.findMany({
                skip: skip,
                take: take,
                orderBy: { code: 'asc' }
            }),
            this.prisma.lockerModel.count()
        ]);

        return {
            data: models.map(LockerMapper.toDomain),
            total,
        }
    }

}