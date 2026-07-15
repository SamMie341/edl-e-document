import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SubDocumentEntity } from '../../domain/entities/sub-document.entity';
import type { ISubDocumentRepository } from '../../domain/repositories/sub-document.repository.interface';
import { SUB_DOCUMENT_REPOSITORY } from '../../domain/repositories/sub-document.repository.interface';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class GetSubDocumentsUseCase {
  constructor(
    @Inject(SUB_DOCUMENT_REPOSITORY)
    private readonly subDocumentRepository: ISubDocumentRepository,
    private readonly prisma: PrismaService,
  ) { }

  async execute(documentId: string): Promise<SubDocumentEntity[]> {
    // ── ຕຳວ່າ Document ມີຢູ່ຈິງ ──────────────────────────────────────────────
    const doc = await this.prisma.documentModel.findUnique({ where: { id: documentId } });
    if (!doc) {
      throw new NotFoundException(`ບໍ່ພົບເອກະສານ ID: ${documentId}`);
    }

    return await this.subDocumentRepository.findByDocumentId(documentId);
  }
}
