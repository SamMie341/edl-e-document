import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppException } from 'src/core/exceptions/app.exception';
import * as repoInterface from '../../domain/repositories/document-type.repository.interface';
import { DocumentType } from '../../domain/entities/document-type.entity';

@Injectable()
export class GetDocumentTypeByIdUseCase {
    constructor(
        @Inject(repoInterface.DOCUMENT_TYPE_REPOSITORY)
        private readonly documentTypeRepository: repoInterface.IDocumentTypeRepository,
    ) { }

    async execute(id: string): Promise<DocumentType> {
        const documentType = await this.documentTypeRepository.findById(id);
        if (!documentType) {
            throw new AppException(
                'DOCUMENT_TYPE_NOT_FOUND',
                `ບໍ່ພົບປະເພດເອກະສານ`,
                {},
                HttpStatus.NOT_FOUND,
            );
        }
        return documentType;
    }
}
