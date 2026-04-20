import { Injectable } from "@nestjs/common";
import { IFolderRepository } from "../../domain/repositories/folder.repository.interface";
import { Folder } from "../../domain/entities/folder.entity";
import { PrismaService } from "src/core/database/prisma.service";
import { FolderMapper } from "../mappers/folder.mapper";

@Injectable()
export class PrismaFolderRepository implements IFolderRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findById(id: string): Promise<Folder | null> {
        const model = await this.prisma.folderModel.findUnique({ where: { id } });
        if (!model) return null;
        return FolderMapper.toDomain(model);
    }

    async findByBranchId(branchId: string): Promise<Folder[]> {
        const models = await this.prisma.folderModel.findMany({
            where: { branchId },
            orderBy: { createdAt: 'desc' }
        });
        return models.map(FolderMapper.toDomain);
    }

    async save(folder: Folder): Promise<void> {
        const data = FolderMapper.toPersistence(folder);
        await this.prisma.folderModel.upsert({
            where: { id: data.id },
            update: data,
            create: data,
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.folderModel.delete({ where: { id } });
    }
}