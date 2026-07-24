import { Inject, Injectable } from '@nestjs/common';
import * as documentRepositoryInterface from '../../domain/repositories/document.repository.interface';

@Injectable()
export class GetExpiredDocumentsUseCase {
  constructor(
    @Inject(documentRepositoryInterface.DOCUMENT_REPOSITORY)
    private readonly documentRepository: documentRepositoryInterface.IDocumentRepository,
  ) { }

  async execute(
    params?: documentRepositoryInterface.ExpiredDocumentFilterParams | boolean | string,
  ) {
    const { data, total } = await this.documentRepository.findExpired(params);

    let page = 1;
    let limit = 10;
    if (typeof params === 'object' && params !== null) {
      page = params.page || 1;
      limit = params.limit || 10;
    }

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
