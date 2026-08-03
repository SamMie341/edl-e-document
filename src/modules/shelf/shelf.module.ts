import { Module } from '@nestjs/common';
import { ShelfController } from './presentation/controllers/shelf.controller';
import { CreateShelfUseCase } from './application/use-cases/create-shelf.use-case';
import { SHELF_REPOSITORY } from './domain/repositories/shelf.repositories.interface';
import { PrismaShelfRepository } from './infrastructure/repositories/prisma-shelf.repository';
import { GetAllShelvesUseCase } from './application/use-cases/get-all-shelves.use-case';
import { UpdateShelfUseCase } from './application/use-cases/update-shelf.use-case';
import { DeleteShelfUseCase } from './application/use-cases/delete-shelf.use-case';
import { GetShelfByIdUseCase } from './application/use-cases/get-shelf-by-id.use-case';
import { GetDropdownShelvesUseCase } from './application/use-cases/get-dropdown-shelves.use-case';
import { CleanupEmptyFoldersUseCase } from './application/use-cases/cleanup-empty-folders.use-case';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ShelfController],
  providers: [
    CreateShelfUseCase,
    GetAllShelvesUseCase,
    GetShelfByIdUseCase,
    GetDropdownShelvesUseCase,
    UpdateShelfUseCase,
    DeleteShelfUseCase,
    CleanupEmptyFoldersUseCase,
    {
      provide: SHELF_REPOSITORY,
      useClass: PrismaShelfRepository,
    },
  ],
  exports: [SHELF_REPOSITORY, CleanupEmptyFoldersUseCase],
})
export class ShelfModule { }
