import { DivisionModule } from './modules/division/division.module';
import { Module } from '@nestjs/common';
import { DocumentModule } from './modules/document/document.module';
import { CoreModule } from './core/core.module';
import { UserModule } from './modules/user/user.module';
import { FolderModule } from './modules/folder/folder.module';
import { BranchModule } from './modules/branch/branch.module';
import { AuditModule } from './modules/audit/audit.module';
import { DocumentTypeModule } from './modules/document-type/document-type.module';
import { DepartmentModule } from './modules/department/department.module';
import { HrmModule } from './modules/hrm/hrm.module';
import { OfficeModule } from './modules/office/office.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TaskModule } from './core/tasks/task.module';
import { UnitModule } from './modules/unit/unit.module';
import { LockerModule } from './modules/locker/locker.module';
import { ShelfModule } from './modules/shelf/shelf.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { AddressModule } from './modules/address/address.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),

    CoreModule,
    TaskModule,

    DivisionModule,
    UserModule,
    DocumentModule,
    FolderModule,
    BranchModule,
    AuditModule,
    DocumentTypeModule,
    DepartmentModule,
    DivisionModule,
    OfficeModule,
    UnitModule,
    LockerModule,
    ShelfModule,
    WarehouseModule,
    AddressModule,

    HrmModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
