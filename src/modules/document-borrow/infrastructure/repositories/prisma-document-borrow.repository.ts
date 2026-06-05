import { Injectable, NotFoundException } from '@nestjs/common';
import {
  IDocumentBorrowRepository,
  CreateDocumentBorrowData,
  DocumentBorrowFilterParams,
} from '../../domain/repositories/document-borrow.repository.interface';
import { DocumentBorrowEntity } from '../../domain/entities/document-borrow.entity';
import { PrismaService } from 'src/core/database/prisma.service';
import { DocumentBorrowMapper } from '../mappers/document-borrow.mapper';

// ─── Include ທົ່ວໄປ ──────────────────────────────────────────────────────────
const BORROW_INCLUDE = {
  borrower: {
    select: {
      id: true,
      firstNameLa: true,
      lastNameLa: true,
      firstNameEng: true,
      lastNameEng: true,
      empCode: true,
    },
  },
  document: {
    select: { id: true, docNo: true, title: true, folderId: true },
  },
  folder: {
    select: { id: true, code: true, name: true },
  },
  toBranch: { select: { id: true, name: true } },
  toDivision: { select: { id: true, name: true } },
  createdBy: {
    select: { id: true, firstNameLa: true, lastNameLa: true, empCode: true },
  },
};

@Injectable()
export class PrismaDocumentBorrowRepository implements IDocumentBorrowRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: CreateDocumentBorrowData): Promise<DocumentBorrowEntity> {
    const model = await this.prisma.documentBorrowModel.create({
      data: {
        documentId: data.documentId,
        folderId: data.folderId,
        borrowerId: data.borrowerId,
        purpose: data.purpose,
        toBranchId: data.toBranchId,
        toDivisionId: data.toDivisionId,
        toLocation: data.toLocation,
        createdById: data.createdById,
        note: data.note,
      },
      include: BORROW_INCLUDE,
    });
    return DocumentBorrowMapper.toDomain(model);
  }

  async findAll(params: DocumentBorrowFilterParams): Promise<{ data: DocumentBorrowEntity[]; total: number }> {
    const { page = 1, limit = 10, documentId, folderId, borrowerId, activeOnly } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (documentId) where.documentId = documentId;
    if (folderId) where.folderId = folderId;
    if (borrowerId) where.borrowerId = borrowerId;
    if (activeOnly) where.returnedAt = null;

    const [models, total] = await Promise.all([
      this.prisma.documentBorrowModel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { borrowedAt: 'desc' },
        include: BORROW_INCLUDE,
      }),
      this.prisma.documentBorrowModel.count({ where }),
    ]);

    return { data: models.map(DocumentBorrowMapper.toDomain), total };
  }

  async findById(id: string): Promise<DocumentBorrowEntity | null> {
    const model = await this.prisma.documentBorrowModel.findUnique({
      where: { id },
      include: BORROW_INCLUDE,
    });
    if (!model) return null;
    return DocumentBorrowMapper.toDomain(model);
  }

  async findByDocumentId(documentId: string): Promise<DocumentBorrowEntity[]> {
    const models = await this.prisma.documentBorrowModel.findMany({
      where: { documentId },
      orderBy: { borrowedAt: 'desc' },
      include: BORROW_INCLUDE,
    });
    return models.map(DocumentBorrowMapper.toDomain);
  }

  async findByFolderId(folderId: string): Promise<DocumentBorrowEntity[]> {
    // ດຶງ borrows ທີ່ຢືມ folder ໂດຍກົງ ຫຼື ຢືມ document ທີ່ຢູ່ໃນ folder ນີ້
    const models = await this.prisma.documentBorrowModel.findMany({
      where: {
        OR: [
          { folderId },
          { document: { folderId } },
        ],
      },
      orderBy: { borrowedAt: 'desc' },
      include: BORROW_INCLUDE,
    });
    return models.map(DocumentBorrowMapper.toDomain);
  }

  async findActive(): Promise<DocumentBorrowEntity[]> {
    const models = await this.prisma.documentBorrowModel.findMany({
      where: { returnedAt: null },
      orderBy: { borrowedAt: 'desc' },
      include: BORROW_INCLUDE,
    });
    return models.map(DocumentBorrowMapper.toDomain);
  }

  async return(id: string, returnedAt: Date): Promise<DocumentBorrowEntity> {
    const model = await this.prisma.documentBorrowModel.update({
      where: { id },
      data: { returnedAt },
      include: BORROW_INCLUDE,
    });
    return DocumentBorrowMapper.toDomain(model);
  }
}
