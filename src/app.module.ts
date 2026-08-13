import { DivisionModule } from './modules/division/division.module';
import { Module } from '@nestjs/common';
import { DocumentModule } from './modules/document/document.module';
import { SubDocumentModule } from './modules/sub-document/sub-document.module';
import { CoreModule } from './core/core.module';
import { UserModule } from './modules/user/user.module';
import { FolderModule } from './modules/folder/folder.module';
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
import { DocumentBorrowModule } from './modules/document-borrow/document-borrow.module';
import { SearchModule } from './modules/search/search.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportModule } from './modules/report/report.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CoreModule,
    TaskModule,
    DivisionModule,
    UserModule,
    DocumentModule,
    SubDocumentModule,
    FolderModule,
    AuditModule,
    DocumentTypeModule,
    DepartmentModule,
    DivisionModule,
    OfficeModule,
    UnitModule,
    LockerModule,
    ShelfModule,
    WarehouseModule,
    DocumentBorrowModule,
    SearchModule,
    HrmModule,
    DashboardModule,
    ReportModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
