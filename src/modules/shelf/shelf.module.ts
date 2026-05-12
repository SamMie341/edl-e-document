import { Module } from "@nestjs/common";
import { ShelfController } from "./presentation/controllers/shelf.controller";
import { CreateShelfUseCase } from "./application/use-cases/create-shelf.use-case";
import { GetShelvesByLockerUseCase } from "./application/use-cases/get-shelves-by-locker.use-case";
import { SHELF_REPOSITORY } from "./domain/repositories/shelf.repositories.interface";
import { PrismaShelfRepository } from "./infrastructure/repositories/prisma-shelf.repository";
import { GetAllShelvesUseCase } from "./application/use-cases/get-all-shelves.use-case";

@Module({
    controllers: [ShelfController],
    providers: [
        CreateShelfUseCase,
        GetAllShelvesUseCase,
        GetShelvesByLockerUseCase,
        {
            provide: SHELF_REPOSITORY,
            useClass: PrismaShelfRepository,
        },
    ],
    exports: [SHELF_REPOSITORY]
})
export class ShelfModule { }