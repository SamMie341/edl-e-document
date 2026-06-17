import { Module } from '@nestjs/common';
import { ShelfController } from './presentation/controllers/shelf.controller';
import { CreateShelfUseCase } from './application/use-cases/create-shelf.use-case';
import { SHELF_REPOSITORY } from './domain/repositories/shelf.repositories.interface';
import { PrismaShelfRepository } from './infrastructure/repositories/prisma-shelf.repository';
import { GetAllShelvesUseCase } from './application/use-cases/get-all-shelves.use-case';
import { UpdateShelfUseCase } from './application/use-cases/update-shelf.use-case';
import { DeleteShelfUseCase } from './application/use-cases/delete-shelf.use-case';
import { GetShelfByIdUseCase } from './application/use-cases/get-shelf-by-id.use-case';

@Module({
  controllers: [ShelfController],
  providers: [
    CreateShelfUseCase,
    GetAllShelvesUseCase,
    GetShelfByIdUseCase,
    UpdateShelfUseCase,
    DeleteShelfUseCase,
    {
      provide: SHELF_REPOSITORY,
      useClass: PrismaShelfRepository,
    },
  ],
  exports: [SHELF_REPOSITORY],
})
export class ShelfModule { }
