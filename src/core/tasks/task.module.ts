import { Module } from '@nestjs/common';
import { DepartmentModule } from 'src/modules/department/department.module';
import { DivisionModule } from 'src/modules/division/division.module';
import { OfficeModule } from 'src/modules/office/office.module';
import { HrmSyncTask } from './hrm-sync.task';
import { UnitModule } from 'src/modules/unit/unit.module';

@Module({
  imports: [DepartmentModule, DivisionModule, OfficeModule, UnitModule],
  providers: [HrmSyncTask],
  exports: [HrmSyncTask],
})
export class TaskModule {}
