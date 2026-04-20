import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import * as documentTypeRepositoryInterface from "../../domain/repositories/document-type.repository.interface";
import { DocumentType } from "../../domain/entities/document-type.entity";
import { AppException } from "src/core/exceptions/app.exception";

@Injectable()
export class GetDocumentTypeByNameUseCase {
    constructor(
        @Inject(documentTypeRepositoryInterface.DOCUMENT_TYPE_REPOSITORY)
        private readonly documentTypeRepository: documentTypeRepositoryInterface.IDocumentTypeRepository
    ) { }

    async execute(name: string): Promise<DocumentType> {
        const type = await this.documentTypeRepository.findByName(name);

        if (!type) {
            throw new AppException(
                'DOCUMENT_TYPE_NOT_FOUND',
                `ບໍ່ພົບປະເພດເອກະສານ: '${name}' ໃນລະບົບ`,
                { searchKeyword: name },
                HttpStatus.NOT_FOUND,
            );
        }

        return type;
    }
}