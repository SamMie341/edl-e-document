import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { UnitController } from './presentation/controllers/unit.controller';
import { SyncUnitUseCase } from './application/use-cases/sync-units.use-case';
import { UNIT_REPOSITORY } from './domain/repositories/unit.repository.interface';
import { HrmUnitRepository } from './infrastructure/repositories/hrm-unit.repository';
import { GetUnitsUseCase } from './application/use-cases/get-units.use-case';

@Module({
  imports: [HttpModule],
  controllers: [UnitController],
  providers: [
    SyncUnitUseCase,
    GetUnitsUseCase,
    {
      provide: UNIT_REPOSITORY,
      useClass: HrmUnitRepository,
    },
  ],
  exports: [UNIT_REPOSITORY, SyncUnitUseCase],
})
export class UnitModule {}
