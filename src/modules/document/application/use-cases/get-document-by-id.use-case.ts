import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import * as documentRepositoryInterface from '../../domain/repositories/document.repository.interface';
import { AppException } from 'src/core/exceptions/app.exception';
import { DocumentEntity } from '../../domain/entities/document.entity';

@Injectable()
export class GetDocumentByIdUseCase {
  constructor(
    @Inject(documentRepositoryInterface.DOCUMENT_REPOSITORY)
    private readonly documentRepository: documentRepositoryInterface.IDocumentRepository,
  ) {}

  async execute(id: string): Promise<DocumentEntity> {
    const document = await this.documentRepository.findById(id);

    if (!document) {
      throw new AppException(
        'NOT_FOUND',
        'ບໍ່ພົບເອກະສານໃນລະບົບ',
        { id },
        HttpStatus.NOT_FOUND,
      );
    }

    return document;
  }
}
