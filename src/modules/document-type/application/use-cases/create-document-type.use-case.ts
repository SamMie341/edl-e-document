import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import * as repoInterface from '../../domain/repositories/document-type.repository.interface';
import { DocumentType } from '../../domain/entities/document-type.entity';
import { CreateDocumentTypeDto } from '../dtos/create-document-type.dto';

@Injectable()
export class CreateDocumentTypeUseCase {
    constructor(
        @Inject(repoInterface.DOCUMENT_TYPE_REPOSITORY)
        private readonly documentTypeRepository: repoInterface.IDocumentTypeRepository,
    ) { }

    async execute(dto: CreateDocumentTypeDto): Promise<DocumentType> {
        return await this.documentTypeRepository.create(dto);
    }
}
