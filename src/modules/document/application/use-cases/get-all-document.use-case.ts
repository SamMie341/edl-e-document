import * as documentRepositoryInterface from '../../domain/repositories/document.repository.interface';
import { Inject, Injectable } from "@nestjs/common";
import { PaginatedResult } from 'src/core/interfaces/paginated-result.interface';

@Injectable()
export class GetAllDocumentUseCase {
    constructor(
        @Inject(documentRepositoryInterface.DOCUMENT_REPOSITORY)
        private readonly documentRepository: documentRepositoryInterface.IDocumentRepository
    ) { }

    async execute(page: number = 1, limit: number = 10): Promise<PaginatedResult<any>> {
        const skip = (page - 1) * limit;
        const { data, total } = await this.documentRepository.findAll(skip, limit);
        const totalPages = Math.ceil(total / limit);

        return { data, meta: { total, page, limit, totalPages } };
    }
}