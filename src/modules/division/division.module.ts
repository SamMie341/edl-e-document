import { Module } from '@nestjs/common';
import { DivisionController } from './presentation/controller/division.controller';
import { SyncDivisionUseCase } from './application/use-cases/sync-divisions.use-case';
import { DIVISION_REPOSITORY } from './domain/repositories/division.repository.interface';
import { HrmDivisionRepository } from './infrastructure/repositories/hrm-division.repository';
import { GetDivisionsUseCase } from './application/use-cases/get-division.use-case';

@Module({
  imports: [],
  controllers: [DivisionController],
  providers: [
    SyncDivisionUseCase,
    GetDivisionsUseCase,
    {
      provide: DIVISION_REPOSITORY,
      useClass: HrmDivisionRepository,
    },
  ],
  exports: [SyncDivisionUseCase, DIVISION_REPOSITORY],
})
export class DivisionModule {}
