import { Module } from '@nestjs/common';
import { DocumentTypeController } from './presentation/controllers/document-type.controller';
import { CreateDocumentTypeUseCase } from './application/use-cases/create-document-type.use-case';
import { GetAllDocumentTypesUseCase } from './application/use-cases/get-all-document-types.use-case';
import { GetDocumentTypeByIdUseCase } from './application/use-cases/get-document-type-by-id.use-case';
import { UpdateDocumentTypeUseCase } from './application/use-cases/update-document-type.use-case';
import { DeleteDocumentTypeUseCase } from './application/use-cases/delete-document-type.use-case';
import { DOCUMENT_TYPE_REPOSITORY } from './domain/repositories/document-type.repository.interface';
import { PrismaDocumentTypeRepository } from './infrastructure/repositories/prisma-document-type.repository';
import { AuditModule } from '../audit/audit.module';
import { GetDocumentTypeByNameUseCase } from './application/use-cases/get-document-type-by-name.use-case';

@Module({
    imports: [AuditModule],
    controllers: [DocumentTypeController],
    providers: [
        CreateDocumentTypeUseCase,
        GetAllDocumentTypesUseCase,
        GetDocumentTypeByIdUseCase,
        UpdateDocumentTypeUseCase,
        DeleteDocumentTypeUseCase,
        GetDocumentTypeByNameUseCase,
        {
            provide: DOCUMENT_TYPE_REPOSITORY,
            useClass: PrismaDocumentTypeRepository,
        },
    ],
    exports: [DOCUMENT_TYPE_REPOSITORY],
})
export class DocumentTypeModule { }
