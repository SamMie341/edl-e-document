import { Injectable } from "@nestjs/common";
import { IShelfRepository } from "../../domain/repositories/shelf.repositories.interface";
import { Shelf } from "../../domain/entitites/shelf.entity";
import { PrismaService } from "src/core/database/prisma.service";
import { ShelfMapper } from "../mappers/shelf.mapper";

@Injectable()
export class PrismaShelfRepository implements IShelfRepository {

    constructor(private readonly prisma: PrismaService) { }

    async create(data: any): Promise<Shelf> {
        const model = await this.prisma.shelfModel.create({ data });
        return ShelfMapper.toDomain(model);
    }

    async findByLockerId(lockerId: string): Promise<Shelf[]> {
        const models = await this.prisma.shelfModel.findMany({
            where: { lockerId },
            orderBy: { code: 'asc' }
        });
        return models.map(model => ShelfMapper.toDomain(model));
    }
}