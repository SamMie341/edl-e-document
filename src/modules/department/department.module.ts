import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { DepartmentController } from "./presentation/controller/department.controller";
import { GetDepartmentsUseCase } from "./application/use-cases/get-department.use-case";
import { DEPARTMENT_REPOSITORY } from "./domain/repositories/department.repository.interface";
import { HrmDepartmentRepository } from "./infrastructure/repositories/hrm-department.repository";
import { SyncDepartmentUseCase } from "./application/use-cases/sync-department.use-case";

@Module({
    imports: [],
    controllers: [DepartmentController],
    providers: [
        GetDepartmentsUseCase,
        SyncDepartmentUseCase,
        {
            provide: DEPARTMENT_REPOSITORY,
            useClass: HrmDepartmentRepository,
        },
    ],
    exports: [
        SyncDepartmentUseCase,
        DEPARTMENT_REPOSITORY,
    ],
})

export class DepartmentModule { }