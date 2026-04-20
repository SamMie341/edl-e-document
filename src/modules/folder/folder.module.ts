import { Module } from "@nestjs/common";
import { FolderController } from "./presentation/controllers/folder.controller";
import { CreateFolderUseCase } from "./application/use-cases/create-folder.use-case";
import { FOLDER_REPOSITORY } from "./domain/repositories/folder.repository.interface";
import { PrismaFolderRepository } from "./infrastructure/repositories/prisma-folder.repository";
import { AuditModule } from "../audit/audit.module";

@Module({
    imports: [AuditModule],
    controllers: [FolderController],
    providers: [
        CreateFolderUseCase,
        {
            provide: FOLDER_REPOSITORY,
            useClass: PrismaFolderRepository,
        },
    ],
    exports: [FOLDER_REPOSITORY],
})
export class FolderModule { }