import { Injectable } from '@nestjs/common';
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
  document: {
    select: { id: true, docNo: true, title: true, folderId: true, departmentId: true, divisionId: true },
  },
  folder: {
    select: { id: true, code: true, name: true },
  },
  toDivision: { select: { id: true, name: true, departmentId: true } },
  createdBy: {
    select: { id: true, firstNameLa: true, lastNameLa: true, empCode: true },
  },
};

// ─── Helper: สร้าง scope where clause ────────────────────────────────────────
// departmentId (BRANCH_ADMIN): กรองผ่าน document.departmentId หรือ toDivision.departmentId
// divisionId   (USER):         กรองผ่าน toDivisionId (ฝั่งรับ)
function buildScopeWhere(
  departmentId?: number,
  divisionId?: number,
): any {
  if (departmentId) {
    return {
      OR: [
        { document: { is: { departmentId } } },
        { documentId: null, toDivision: { is: { departmentId } } },
      ],
    };
  }
  if (divisionId) {
    return { toDivisionId: divisionId };
  }
  return {};
}

@Injectable()
export class PrismaDocumentBorrowRepository implements IDocumentBorrowRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: CreateDocumentBorrowData): Promise<DocumentBorrowEntity> {
    const model = await this.prisma.documentBorrowModel.create({
      data: {
        documentId: data.documentId,
        folderId: data.folderId,
        borrower: data.borrower,
        purpose: data.purpose,
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
    const { page = 1, limit = 10, documentId, folderId, divisionId, departmentId, activeOnly } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      ...buildScopeWhere(departmentId, divisionId),
    };
    if (documentId) where.documentId = documentId;
    if (folderId) where.folderId = folderId;
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

  async findByDocumentId(
    documentId: string,
    departmentId?: number,
    divisionId?: number,
  ): Promise<DocumentBorrowEntity[]> {
    const scope = buildScopeWhere(departmentId, divisionId);
    const where: any = { documentId, ...scope };

    const models = await this.prisma.documentBorrowModel.findMany({
      where,
      orderBy: { borrowedAt: 'desc' },
      include: BORROW_INCLUDE,
    });
    return models.map(DocumentBorrowMapper.toDomain);
  }

  async findByFolderId(
    folderId: string,
    departmentId?: number,
    divisionId?: number,
  ): Promise<DocumentBorrowEntity[]> {
    const scope = buildScopeWhere(departmentId, divisionId);

    // ຮວມ folder scope ກັບ scope ຂອງ role:
    // ດຶງ borrows ທີ່ຢືມ folder ໂດຍກົງ ຫຼື ຢືມ document ທີ່ຢູ່ໃນ folder ນີ້
    let where: any;
    if (scope.OR) {
      // BRANCH_ADMIN: ຕ້ອງ match ທັງ folder ແລະ department scope
      where = {
        AND: [
          { OR: [{ folderId }, { document: { folderId } }] },
          { OR: scope.OR },
        ],
      };
    } else if (scope.toDivisionId) {
      // USER: ຕ້ອງ match ທັງ folder ແລະ division scope
      where = {
        AND: [
          { OR: [{ folderId }, { document: { folderId } }] },
          { toDivisionId: scope.toDivisionId },
        ],
      };
    } else {
      where = {
        OR: [{ folderId }, { document: { folderId } }],
      };
    }

    const models = await this.prisma.documentBorrowModel.findMany({
      where,
      orderBy: { borrowedAt: 'desc' },
      include: BORROW_INCLUDE,
    });
    return models.map(DocumentBorrowMapper.toDomain);
  }

  async findByDivisionId(divisionId: number, activeOnly = false): Promise<DocumentBorrowEntity[]> {
    const where: any = { toDivisionId: divisionId };
    if (activeOnly) where.returnedAt = null;

    const models = await this.prisma.documentBorrowModel.findMany({
      where,
      orderBy: { borrowedAt: 'desc' },
      include: BORROW_INCLUDE,
    });
    return models.map(DocumentBorrowMapper.toDomain);
  }

  async findActive(departmentId?: number, divisionId?: number): Promise<DocumentBorrowEntity[]> {
    const scope = buildScopeWhere(departmentId, divisionId);
    const where: any = { returnedAt: null, ...scope };

    const models = await this.prisma.documentBorrowModel.findMany({
      where,
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
