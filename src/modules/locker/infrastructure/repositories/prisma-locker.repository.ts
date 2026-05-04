import { Injectable } from "@nestjs/common";
import { ILockerRepository } from "../../domain/repositories/locker.repository.interface";
import { Locker } from "../../domain/entities/locker.entity";
import { PrismaService } from "src/core/database/prisma.service";
import { LockerMapper } from "../mappers/locker.mapper";

@Injectable()
export class PrismaLockerRepository implements ILockerRepository {

    constructor(private readonly prisma: PrismaService) { }

    async create(data: any): Promise<Locker> {
        const model = await this.prisma.lockerModel.create({ data });
        return LockerMapper.toDomain(model);
    }
    async findAll(skip?: number, take?: number): Promise<{ data: Locker[]; total: number; }> {

        const [models, total] = await this.prisma.$transaction([
            this.prisma.lockerModel.findMany({
                skip: skip,
                take: take,
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.lockerModel.count()
        ]);

        return {
            data: models.map(LockerMapper.toDomain),
            total,
        }
    }

}