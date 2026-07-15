import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { UpdateSubDocumentDto } from '../dtos/update-sub-document.dto';
import { SubDocumentEntity } from '../../domain/entities/sub-document.entity';
import type { ISubDocumentRepository } from '../../domain/repositories/sub-document.repository.interface';
import { SUB_DOCUMENT_REPOSITORY } from '../../domain/repositories/sub-document.repository.interface';

@Injectable()
export class UpdateSubDocumentUseCase {
  constructor(
    @Inject(SUB_DOCUMENT_REPOSITORY)
    private readonly subDocumentRepository: ISubDocumentRepository,
  ) { }

  async execute(id: string, dto: UpdateSubDocumentDto): Promise<SubDocumentEntity> {
    const existing = await this.subDocumentRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`ບໍ່ພົບເອກະສານຍ່ອຍ ID: ${id}`);
    }

    return await this.subDocumentRepository.update(id, dto);
  }
}
