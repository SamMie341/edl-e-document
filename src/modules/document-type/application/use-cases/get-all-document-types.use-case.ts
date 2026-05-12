import { Inject, Injectable } from '@nestjs/common';
import * as repoInterface from '../../domain/repositories/document-type.repository.interface';
import { DocumentType } from '../../domain/entities/document-type.entity';
import { PaginatedResult } from 'src/core/interfaces/paginated-result.interface';

@Injectable()
export class GetAllDocumentTypesUseCase {
    constructor(
        @Inject(repoInterface.DOCUMENT_TYPE_REPOSITORY)
        private readonly documentTypeRepository: repoInterface.IDocumentTypeRepository,
    ) { }

    async execute(page: number = 1, limit: number = 100): Promise<PaginatedResult<any>> {
        const skip = (page - 1) * limit;
        const { data, total } = await this.documentTypeRepository.findAll(skip, limit);
        const totalPages = Math.ceil(total / limit);
        return { data, meta: { total, page, limit, totalPages } };
    }
}
