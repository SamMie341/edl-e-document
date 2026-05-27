import { Module } from "@nestjs/common";
import { FolderController } from "./presentation/controllers/folder.controller";
import { CreateFolderUseCase } from "./application/use-cases/create-folder.use-case";
import { UpdateFolderUseCase } from "./application/use-cases/update-folder.use-case";
import { DeleteFolderUseCase } from "./application/use-cases/delete-folder.use-case";
import { FOLDER_REPOSITORY } from "./domain/repositories/folder.repository.interface";
import { PrismaFolderRepository } from "./infrastructure/repositories/prisma-folder.repository";
import { AuditModule } from "../audit/audit.module";
import { GetFoldersByShelfUseCase } from "./application/use-cases/get-folders-by-shelf.use-case";
import { GetAllFolderUseCase } from "./application/use-cases/get-all-folders.use-case";

@Module({
    imports: [AuditModule],
    controllers: [FolderController],
    providers: [
        CreateFolderUseCase,
        UpdateFolderUseCase,
        DeleteFolderUseCase,
        GetAllFolderUseCase,
        GetFoldersByShelfUseCase,
        {
            provide: FOLDER_REPOSITORY,
            useClass: PrismaFolderRepository,
        },
    ],
    exports: [FOLDER_REPOSITORY],
})
export class FolderModule { }