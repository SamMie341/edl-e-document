import * as documentRepositoryInterface from '../../domain/repositories/document.repository.interface';
import { Inject, Injectable } from '@nestjs/common';
import { PaginatedResult } from 'src/core/interfaces/paginated-result.interface';

@Injectable()
export class GetAllDocumentUseCase {
  constructor(
    @Inject(documentRepositoryInterface.DOCUMENT_REPOSITORY)
    private readonly documentRepository: documentRepositoryInterface.IDocumentRepository,
  ) {}

  async execute(params: documentRepositoryInterface.DocumentFilterParams) {
    const { data, total } = await this.documentRepository.findAll(params);

    return {
      data: data,
      meta: {
        total,
        page: params.page || 1,
        limit: params.limit || 10,
        totalPages: Math.ceil(total / (params.limit || 10)),
      },
    };
  }
}
