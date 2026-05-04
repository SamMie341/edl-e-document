
import * as documentRepositoryInterface from '../../domain/repositories/document.repository.interface';
import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppException } from 'src/core/exceptions/app.exception';

@Injectable()
export class GetAllDocumentUseCase {
    constructor(
        @Inject(documentRepositoryInterface.DOCUMENT_REPOSITORY)
        private readonly documentRepository: documentRepositoryInterface.IDocumentRepository
    ) { }

    async execute() {
        const doc = await this.documentRepository.findAll();
        if (!doc) {
            throw new AppException(
                'DOCUMENT_NOT_FOUND',
                'ບໍ່ພົບເອກະສານ...',
                '',
                HttpStatus.NOT_FOUND,
            );
        }
        return doc;
    }
}