import { Module } from '@nestjs/common';
import { FolderController } from './presentation/controllers/folder.controller';
import { CreateFolderUseCase } from './application/use-cases/create-folder.use-case';
import { UpdateFolderUseCase } from './application/use-cases/update-folder.use-case';
import { DeleteFolderUseCase } from './application/use-cases/delete-folder.use-case';
import { FOLDER_REPOSITORY } from './domain/repositories/folder.repository.interface';
import { PrismaFolderRepository } from './infrastructure/repositories/prisma-folder.repository';
import { AuditModule } from '../audit/audit.module';
import { GetAllFolderUseCase } from './application/use-cases/get-all-folders.use-case';
import { GetFolderByIdUseCase } from './application/use-cases/get-folder-by-id.use-case';
import { GetFolderDropdownUseCase } from './application/use-cases/get-folder-dropdown.use-case';

@Module({
  imports: [AuditModule],
  controllers: [FolderController],
  providers: [
    CreateFolderUseCase,
    UpdateFolderUseCase,
    DeleteFolderUseCase,
    GetAllFolderUseCase,
    GetFolderByIdUseCase,
    GetFolderDropdownUseCase,
    {
      provide: FOLDER_REPOSITORY,
      useClass: PrismaFolderRepository,
    },
  ],
  exports: [FOLDER_REPOSITORY],
})
export class FolderModule { }
