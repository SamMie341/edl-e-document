import { ConflictException, Injectable } from "@nestjs/common";
import { IShelfRepository } from "../../domain/repositories/shelf.repositories.interface";
import { Shelf } from "../../domain/entitites/shelf.entity";
import { PrismaService } from "src/core/database/prisma.service";
import { ShelfMapper } from "../mappers/shelf.mapper";

@Injectable()
export class PrismaShelfRepository implements IShelfRepository {

    constructor(private readonly prisma: PrismaService) { }

    async findAll(skip?: number, take?: number): Promise<{ data: Shelf[]; total: number; }> {
        const [models, total] = await this.prisma.$transaction([
            this.prisma.shelfModel.findMany({
                skip, take,
                orderBy: { code: 'asc' },
            }),
            this.prisma.shelfModel.count(),
        ]);

        return {
            data: models.map(ShelfMapper.toDomain),
            total,
        }
    }

    async create(data: any): Promise<Shelf> {
        const existing = await this.prisma.shelfModel.findFirst({
            where: { code: data.code, lockerId: data.lockerId }
        });
        if (existing) {
            throw new ConflictException(`ລະຫັດຊັ້ນວາງ '${data.code}' ມີຢູ່ແລ້ວ`);
        }

        const model = await this.prisma.shelfModel.create({ data });
        return ShelfMapper.toDomain(model);
    }

    async findByLockerId(lockerId: string): Promise<Shelf[]> {
        const models = await this.prisma.shelfModel.findMany({
            where: { lockerId, status: 'A' },
            orderBy: { code: 'asc' }
        });
        return models.map(model => ShelfMapper.toDomain(model));
    }
}