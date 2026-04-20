import { Inject, Injectable } from '@nestjs/common';
import * as repoInterface from '../../domain/repositories/document-type.repository.interface';
import { DocumentType } from '../../domain/entities/document-type.entity';

@Injectable()
export class GetAllDocumentTypesUseCase {
    constructor(
        @Inject(repoInterface.DOCUMENT_TYPE_REPOSITORY)
        private readonly documentTypeRepository: repoInterface.IDocumentTypeRepository,
    ) { }

    async execute(): Promise<DocumentType[]> {
        return this.documentTypeRepository.findAll();
    }
}
