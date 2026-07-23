import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DivisionController } from './presentation/controller/division.controller';
import { GetDivisionsUseCase } from './application/use-cases/get-division.use-case';
import { GetDivisionsByDepartmentUseCase } from './application/use-cases/get-divisions-by-department.use-case';
import { GetDivisionByIdUseCase } from './application/use-cases/get-division-by-id.use-case';
import { CreateDivisionUseCase } from './application/use-cases/create-division.use-case';
import { UpdateDivisionUseCase } from './application/use-cases/update-division.use-case';
import { DeleteDivisionUseCase } from './application/use-cases/delete-division.use-case';
import { DIVISION_REPOSITORY } from './domain/repositories/division.repository.interface';
import { HrmDivisionRepository } from './infrastructure/repositories/hrm-division.repository';
import { SyncDivisionUseCase } from './application/use-cases/sync-divisions.use-case';

@Module({
  imports: [HttpModule],
  controllers: [DivisionController],
  providers: [
    SyncDivisionUseCase,
    GetDivisionsUseCase,
    GetDivisionsByDepartmentUseCase,
    GetDivisionByIdUseCase,
    CreateDivisionUseCase,
    UpdateDivisionUseCase,
    DeleteDivisionUseCase,
    {
      provide: DIVISION_REPOSITORY,
      useClass: HrmDivisionRepository,
    },
  ],
  exports: [SyncDivisionUseCase, GetDivisionsByDepartmentUseCase, DIVISION_REPOSITORY],
})
export class DivisionModule {}
