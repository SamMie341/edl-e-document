import { Module } from "@nestjs/common";
import { WarehouseController } from "./presentation/controllers/warehouse.controller";
import { CreateWarehouseUseCase } from "./application/use-cases/create-warehouse.use-case";
import { GetWarehousesByBranchUseCase } from "./application/use-cases/get-warehouse-by-branch.use-case";
import { WAREHOUSE_REPOSITORY } from "./domain/repositories/warehouse.repository.interface";
import { PrismaWarehouseRepository } from "./infrastructure/repositories/prisma-warehouse.repository";
import { GetAllWarehouseUseCase } from "./application/use-cases/get-all-warehouse.use-case";
import { UpdateWarehouseUseCase } from "./application/use-cases/update-warehouse.use-case";
import { DeleteWarehouseUseCase } from "./application/use-cases/delete-warehouse.use-case";

@Module({
    controllers: [WarehouseController],
    providers: [
        CreateWarehouseUseCase,
        GetAllWarehouseUseCase,
        GetWarehousesByBranchUseCase,
        UpdateWarehouseUseCase,
        DeleteWarehouseUseCase,
        {
            provide: WAREHOUSE_REPOSITORY,
            useClass: PrismaWarehouseRepository,
        }
    ],
    exports: [WAREHOUSE_REPOSITORY]
})
export class WarehouseModule { }