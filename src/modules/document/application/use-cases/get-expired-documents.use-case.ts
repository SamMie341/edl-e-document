import { Inject, Injectable } from '@nestjs/common';
import * as documentRepositoryInterface from '../../domain/repositories/document.repository.interface';

@Injectable()
export class GetExpiredDocumentsUseCase {
  constructor(
    @Inject(documentRepositoryInterface.DOCUMENT_REPOSITORY)
    private readonly documentRepository: documentRepositoryInterface.IDocumentRepository,
  ) { }

  async execute() {
    const data = await this.documentRepository.findExpired();
    return { data, total: data.length };
  }
}
