import { Inject, Injectable } from '@nestjs/common';
import * as repoInterface from '../../domain/repositories/document-type.repository.interface';

@Injectable()
export class GetAllDocumentTypesUseCase {
  constructor(
    @Inject(repoInterface.DOCUMENT_TYPE_REPOSITORY)
    private readonly documentTypeRepository: repoInterface.IDocumentTypeRepository,
  ) {}

  async execute(params: repoInterface.DocumentTypeFilterParams) {
    const { data, total } = await this.documentTypeRepository.findAll(params);
    return {
      data,
      meta: {
        total,
        page: params.page || 1,
        limit: params.limit || 100,
        totalPages: Math.ceil(total / (params.limit || 100)),
      },
    };
  }
}
