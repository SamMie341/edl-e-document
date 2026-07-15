import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { ISubDocumentRepository } from '../../domain/repositories/sub-document.repository.interface';
import { SubDocumentEntity } from '../../domain/entities/sub-document.entity';
import { PrismaService } from 'src/core/database/prisma.service';
import { SubDocumentMapper } from '../mappers/sub-document.mapper';

@Injectable()
export class PrismaSubDocumentRepository implements ISubDocumentRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(documentId: string, data: any): Promise<SubDocumentEntity> {
    // ── ຕຳວ່າ subDocNo ຊ້ຳພາຍໃຕ້ documentId ດຽວກັນ ──────────────────────────
    const existing = await this.prisma.subDocumentModel.findUnique({
      where: { documentId_subDocNo: { documentId, subDocNo: data.subDocNo } },
    });
    if (existing) {
      throw new ConflictException(
        `ເລກທີ່ເອກະສານຍ່ອຍ '${data.subDocNo}' ມີຢູ່ໃນເອກະສານນີ້`,
      );
    }

    const model = await this.prisma.subDocumentModel.create({
      data: {
        subDocNo: data.subDocNo,
        subDocDate: data.subDocDate,
        documentId,
      },
    });
    return SubDocumentMapper.toDomain(model);
  }

  async createMany(documentId: string, dataList: any[]): Promise<SubDocumentEntity[]> {
    const inputNos = dataList.map((d) => d.subDocNo);
    const hasSelfDuplicates = inputNos.some((val, i) => inputNos.indexOf(val) !== i);
    if (hasSelfDuplicates) {
      throw new ConflictException(`ມີເລກທີ່ເອກະສານຍ່ອຍຊ້ຳກັນໃນຂໍ້ມູນທີ່ສົ່ງມາ`);
    }

    const existing = await this.prisma.subDocumentModel.findMany({
      where: {
        documentId,
        subDocNo: { in: inputNos },
      },
    });
    if (existing.length > 0) {
      const duplicateNos = existing.map((e) => e.subDocNo).join(', ');
      throw new ConflictException(
        `ເລກທີ່ເອກະສານຍ່ອຍ '${duplicateNos}' ມີຢູ່ໃນເອກະສານນີ້ແລ້ວ`,
      );
    }

    const createdModels = await this.prisma.$transaction(
      dataList.map((data) =>
        this.prisma.subDocumentModel.create({
          data: {
            subDocNo: data.subDocNo,
            subDocDate: data.subDocDate,
            documentId,
          },
        }),
      ),
    );

    return createdModels.map((m) => SubDocumentMapper.toDomain(m));
  }

  async findByDocumentId(documentId: string): Promise<SubDocumentEntity[]> {
    const models = await this.prisma.subDocumentModel.findMany({
      where: { documentId },
      orderBy: { createdAt: 'asc' },
    });
    return models.map((m) => SubDocumentMapper.toDomain(m));
  }

  async findById(id: string): Promise<SubDocumentEntity | null> {
    const model = await this.prisma.subDocumentModel.findUnique({ where: { id } });
    if (!model) return null;
    return SubDocumentMapper.toDomain(model);
  }

  async update(id: string, data: any): Promise<SubDocumentEntity> {
    const existing = await this.prisma.subDocumentModel.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`ບໍ່ພົບເອກະສານຍ່ອຍ ID: ${id}`);
    }

    // ── ຕຳວ່າ subDocNo ໃໝ່ ຊ້ຳກັບ record ອື່ນພາຍໃຕ້ documentId ດຽວກັນ ────────
    if (data.subDocNo && data.subDocNo !== existing.subDocNo) {
      const duplicate = await this.prisma.subDocumentModel.findUnique({
        where: {
          documentId_subDocNo: {
            documentId: existing.documentId,
            subDocNo: data.subDocNo,
          },
        },
      });
      if (duplicate) {
        throw new ConflictException(
          `ເລກທີ່ເອກະສານຍ່ອຍ '${data.subDocNo}' ມີຢູ່ແລ້ວພາຍໃຕ້ເອກະສານນີ້`,
        );
      }
    }

    const model = await this.prisma.subDocumentModel.update({
      where: { id },
      data: {
        ...(data.subDocNo !== undefined && { subDocNo: data.subDocNo }),
        ...(data.subDocDate !== undefined && { subDocDate: data.subDocDate }),
      },
    });
    return SubDocumentMapper.toDomain(model);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.subDocumentModel.delete({ where: { id } });
  }
}
