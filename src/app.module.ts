import { Module } from '@nestjs/common';
import { DocumentModule } from './modules/document/document.module';
import { CoreModule } from './core/core.module';
import { UserModule } from './modules/user/user.module';
import { FolderModule } from './modules/folder/folder.module';
import { BranchModule } from './modules/branch/branch.module';
import { AuditModule } from './modules/audit/audit.module';
import { DocumentTypeModule } from './modules/document-type/document-type.module';

@Module({
  imports: [
    CoreModule,
    UserModule,
    DocumentModule,
    FolderModule,
    BranchModule,
    AuditModule,
    DocumentTypeModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
