import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DepartmentController } from './presentation/controller/department.controller';
import { GetDepartmentsUseCase } from './application/use-cases/get-department.use-case';
import { GetDepartmentByIdUseCase } from './application/use-cases/get-department-by-id.use-case';
import { CreateDepartmentUseCase } from './application/use-cases/create-department.use-case';
import { UpdateDepartmentUseCase } from './application/use-cases/update-department.use-case';
import { DeleteDepartmentUseCase } from './application/use-cases/delete-department.use-case';
import { DEPARTMENT_REPOSITORY } from './domain/repositories/department.repository.interface';
import { HrmDepartmentRepository } from './infrastructure/repositories/hrm-department.repository';
import { SyncDepartmentUseCase } from './application/use-cases/sync-department.use-case';

@Module({
  imports: [HttpModule],
  controllers: [DepartmentController],
  providers: [
    GetDepartmentsUseCase,
    GetDepartmentByIdUseCase,
    CreateDepartmentUseCase,
    UpdateDepartmentUseCase,
    DeleteDepartmentUseCase,
    SyncDepartmentUseCase,
    {
      provide: DEPARTMENT_REPOSITORY,
      useClass: HrmDepartmentRepository,
    },
  ],
  exports: [SyncDepartmentUseCase, DEPARTMENT_REPOSITORY],
})
export class DepartmentModule { }
