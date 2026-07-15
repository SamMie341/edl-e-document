import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { ISubDocumentRepository } from '../../domain/repositories/sub-document.repository.interface';
import { SUB_DOCUMENT_REPOSITORY } from '../../domain/repositories/sub-document.repository.interface';

@Injectable()
export class DeleteSubDocumentUseCase {
  constructor(
    @Inject(SUB_DOCUMENT_REPOSITORY)
    private readonly subDocumentRepository: ISubDocumentRepository,
  ) { }

  async execute(id: string): Promise<{ message: string }> {
    const existing = await this.subDocumentRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`ບໍ່ພົບເອກະສານຍ່ອຍ ID: ${id}`);
    }

    await this.subDocumentRepository.delete(id);
    return { message: 'ລຶບເອກະສານຍ່ອຍສຳເລັດ' };
  }
}
