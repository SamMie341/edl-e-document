import { Injectable } from "@nestjs/common";
import { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { PrismaService } from "src/core/database/prisma.service";
import { User } from "../../domain/entities/user.entity";
import { UserMapper } from "../mappers/user.mapper";

@Injectable()
export class PrismaUserRepository implements IUserRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string): Promise<User | null> {
        const model = await this.prisma.userModel.findUnique({ where: { id } });
        if (!model) return null;
        return UserMapper.toDomain(model);
    }

    async findByUsername(username: string): Promise<User | null> {
        const model = await this.prisma.userModel.findUnique({ where: { username } });
        if (!model) return null;
        return UserMapper.toDomain(model);
    }

    async save(user: User): Promise<void> {
        const data = UserMapper.toPersistence(user);
        await this.prisma.userModel.upsert({
            where: { id: data.id },
            update: data,
            create: data,
        });
    }

}