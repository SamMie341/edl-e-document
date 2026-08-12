import { Injectable } from '@nestjs/common';
import {
  IDocumentBorrowRepository,
  CreateDocumentBorrowData,
  DocumentBorrowFilterParams,
} from '../../domain/repositories/document-borrow.repository.interface';
import { DocumentBorrowEntity, DocumentBorrowItemEntity } from '../../domain/entities/document-borrow.entity';
import { PrismaService } from 'src/core/database/prisma.service';
import { DocumentBorrowMapper } from '../mappers/document-borrow.mapper';
import { DocumentBorrowItemMapper } from '../mappers/document-borrow-item.mapper';

// ─── Includes ───────────────────────────────────────────────────────────────
const BORROW_ITEM_INCLUDE = {
  document: {
    select: {
      id: true,
      docNo: true,
      title: true,
      folderId: true,
      departmentId: true,
      divisionId: true,
      attachments: true,
    },
  },
  folder: {
    select: { id: true, code: true, name: true },
  },
};

const BORROW_HEADER_INCLUDE = {
  items: {
    include: BORROW_ITEM_INCLUDE,
  },
  toDivision: { select: { id: true, name: true, departmentId: true } },
  createdBy: {
    select: { id: true, firstNameLa: true, lastNameLa: true, empCode: true },
  },
};

// ─── Helper: สร้าง scope where clause ────────────────────────────────────────
// departmentId (BRANCH_ADMIN): ກອງຜ່ານ items.document.departmentId, items.folder... ຫຼື toDivision.departmentId
// divisionId   (USER):         ກອງຜ່ານ items.document.divisionId, items.folder... ຫຼື toDivisionId (ຝັງຮັບ)
function buildScopeWhere(
  departmentId?: number,
  divisionId?: number,
): any {
  if (departmentId) {
    return {
      OR: [
        { items: { some: { document: { is: { departmentId } } } } },
        { items: { some: { folder: { is: { documents: { some: { departmentId } } } } } } },
        { toDivision: { is: { departmentId } } },
      ],
    };
  }
  if (divisionId) {
    return {
      OR: [
        { items: { some: { document: { is: { divisionId } } } } },
        { items: { some: { folder: { is: { documents: { some: { divisionId } } } } } } },
        { toDivisionId: divisionId },
      ],
    };
  }
  return {};
}

@Injectable()
export class PrismaDocumentBorrowRepository implements IDocumentBorrowRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: CreateDocumentBorrowData): Promise<DocumentBorrowEntity> {
    const model = await this.prisma.documentBorrowModel.create({
      data: {
        borrower: data.borrower,
        phone: data.phone,
        dueDate: data.dueDate,
        purpose: data.purpose,
        toDivisionId: data.toDivisionId,
        toLocation: data.toLocation,
        createdById: data.createdById,
        note: data.note,
        status: 'BORROWED',
        items: {
          create: data.items.map((item) => ({
            documentId: item.documentId,
            folderId: item.folderId,
            note: item.note,
            status: 'BORROWED',
          })),
        },
      },
      include: BORROW_HEADER_INCLUDE,
    });
    return DocumentBorrowMapper.toDomain(model);
  }

  async findAll(params: DocumentBorrowFilterParams): Promise<{ data: DocumentBorrowEntity[]; total: number }> {
    const { page = 1, limit = 10, documentId, folderId, type, divisionId, departmentId, activeOnly, borrowedAt, returnedAt, status, search } = params;
    const skip = (page - 1) * limit;

    const andConditions: any[] = [];

    // Scope filter (BRANCH_ADMIN / USER)
    const scopeWhere = buildScopeWhere(departmentId, divisionId);
    if (scopeWhere.OR) {
      andConditions.push({ OR: scopeWhere.OR });
    }
    if (scopeWhere.toDivisionId) {
      andConditions.push({ toDivisionId: scopeWhere.toDivisionId });
    }

    if (documentId) {
      andConditions.push({ items: { some: { documentId } } });
    }
    if (folderId) {
      andConditions.push({ items: { some: { OR: [{ folderId }, { document: { is: { folderId } } }] } } });
    }
    if (activeOnly) {
      andConditions.push({ status: { in: ['BORROWED', 'PARTIALLY_RETURNED'] } });
    }
    if (status) {
      andConditions.push({ status });
    }

    if (type) {
      const upperType = type.toUpperCase();
      if (upperType === 'DOCUMENT') {
        andConditions.push({ items: { some: { documentId: { not: null } } } });
      } else if (upperType === 'FOLDER') {
        andConditions.push({ items: { some: { folderId: { not: null } } } });
      }
    }

    if (search) {
      andConditions.push({
        OR: [
          { borrower: { contains: search, mode: 'insensitive' } },
          { purpose: { contains: search, mode: 'insensitive' } },
          { items: { some: { document: { is: { title: { contains: search, mode: 'insensitive' } } } } } },
          { items: { some: { document: { is: { docNo: { contains: search, mode: 'insensitive' } } } } } },
          { items: { some: { folder: { is: { name: { contains: search, mode: 'insensitive' } } } } } },
          { items: { some: { folder: { is: { code: { contains: search, mode: 'insensitive' } } } } } },
        ],
      });
    }

    if (borrowedAt) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(borrowedAt)) {
        andConditions.push({
          borrowedAt: {
            gte: new Date(`${borrowedAt}T00:00:00.000Z`),
            lte: new Date(`${borrowedAt}T23:59:59.999Z`),
          },
        });
      } else {
        const date = new Date(borrowedAt);
        if (!isNaN(date.getTime())) {
          const yyyy = date.getUTCFullYear();
          const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
          const dd = String(date.getUTCDate()).padStart(2, '0');
          andConditions.push({
            borrowedAt: {
              gte: new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`),
              lte: new Date(`${yyyy}-${mm}-${dd}T23:59:59.999Z`),
            },
          });
        }
      }
    }

    if (returnedAt) {
      andConditions.push({
        items: {
          some: {
            returnedAt: /^\d{4}-\d{2}-\d{2}$/.test(returnedAt)
              ? {
                gte: new Date(`${returnedAt}T00:00:00.000Z`),
                lte: new Date(`${returnedAt}T23:59:59.999Z`),
              }
              : undefined,
          },
        },
      });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    const [models, total] = await Promise.all([
      this.prisma.documentBorrowModel.findMany({
        where,
        skip,
        take: limit,
        orderBy: { borrowedAt: 'desc' },
        include: BORROW_HEADER_INCLUDE,
      }),
      this.prisma.documentBorrowModel.count({ where }),
    ]);

    return { data: models.map(DocumentBorrowMapper.toDomain), total };
  }

  async findById(id: string): Promise<DocumentBorrowEntity | null> {
    const model = await this.prisma.documentBorrowModel.findUnique({
      where: { id },
      include: BORROW_HEADER_INCLUDE,
    });
    if (!model) return null;
    return DocumentBorrowMapper.toDomain(model);
  }

  async findItemById(itemId: string): Promise<DocumentBorrowItemEntity | null> {
    const item = await this.prisma.documentBorrowItemModel.findUnique({
      where: { id: itemId },
      include: BORROW_ITEM_INCLUDE,
    });
    if (!item) return null;
    return DocumentBorrowItemMapper.toDomain(item);
  }

  async findByDocumentId(
    documentId: string,
    departmentId?: number,
    divisionId?: number,
  ): Promise<DocumentBorrowEntity[]> {
    const doc = await this.prisma.documentModel.findUnique({
      where: { id: documentId },
      select: { folderId: true },
    });

    const itemCondition = doc?.folderId
      ? { OR: [{ documentId }, { folderId: doc.folderId }] }
      : { documentId };

    const docWhere: any = { items: { some: itemCondition } };

    const scope = buildScopeWhere(departmentId, divisionId);
    let where: any;
    if (scope.OR) {
      where = { AND: [docWhere, { OR: scope.OR }] };
    } else if (scope.toDivisionId) {
      where = { AND: [docWhere, { toDivisionId: scope.toDivisionId }] };
    } else {
      where = docWhere;
    }

    const models = await this.prisma.documentBorrowModel.findMany({
      where,
      orderBy: { borrowedAt: 'desc' },
      include: BORROW_HEADER_INCLUDE,
    });
    return models.map(DocumentBorrowMapper.toDomain);
  }

  async findByFolderId(
    folderId: string,
    departmentId?: number,
    divisionId?: number,
  ): Promise<DocumentBorrowEntity[]> {
    const scope = buildScopeWhere(departmentId, divisionId);
    const folderWhere = {
      items: {
        some: {
          OR: [{ folderId }, { document: { is: { folderId } } }],
        },
      },
    };

    let where: any;
    if (scope.OR) {
      where = { AND: [folderWhere, { OR: scope.OR }] };
    } else if (scope.toDivisionId) {
      where = { AND: [folderWhere, { toDivisionId: scope.toDivisionId }] };
    } else {
      where = folderWhere;
    }

    const models = await this.prisma.documentBorrowModel.findMany({
      where,
      orderBy: { borrowedAt: 'desc' },
      include: BORROW_HEADER_INCLUDE,
    });
    return models.map(DocumentBorrowMapper.toDomain);
  }

  async findByDivisionId(divisionId: number, activeOnly = false): Promise<DocumentBorrowEntity[]> {
    const where: any = { toDivisionId: divisionId };
    if (activeOnly) {
      where.status = { in: ['BORROWED', 'PARTIALLY_RETURNED'] };
    }

    const models = await this.prisma.documentBorrowModel.findMany({
      where,
      orderBy: { borrowedAt: 'desc' },
      include: BORROW_HEADER_INCLUDE,
    });
    return models.map(DocumentBorrowMapper.toDomain);
  }

  async findActive(
    departmentId?: number,
    divisionId?: number,
    upcomingDays?: number,
  ): Promise<DocumentBorrowEntity[]> {
    const scope = buildScopeWhere(departmentId, divisionId);
    const andConditions: any[] = [
      { status: { in: ['BORROWED', 'PARTIALLY_RETURNED'] } },
    ];

    if (scope.OR) {
      andConditions.push({ OR: scope.OR });
    } else if (scope.toDivisionId) {
      andConditions.push({ toDivisionId: scope.toDivisionId });
    }

    if (upcomingDays && upcomingDays > 0) {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + upcomingDays);
      andConditions.push({
        dueDate: {
          gte: now,
          lte: futureDate,
        },
      });
    }

    const where = { AND: andConditions };

    const models = await this.prisma.documentBorrowModel.findMany({
      where,
      orderBy: { borrowedAt: 'desc' },
      include: BORROW_HEADER_INCLUDE,
    });
    return models.map(DocumentBorrowMapper.toDomain);
  }

  async return(id: string, returnedAt: Date): Promise<DocumentBorrowEntity> {
    await this.prisma.documentBorrowItemModel.updateMany({
      where: { borrowId: id },
      data: {
        returnedAt,
        status: 'RETURNED',
      },
    });

    const model = await this.prisma.documentBorrowModel.update({
      where: { id },
      data: {
        status: 'RETURNED',
      },
      include: BORROW_HEADER_INCLUDE,
    });
    return DocumentBorrowMapper.toDomain(model);
  }

  async returnItem(itemId: string, returnedAt: Date): Promise<{ item: DocumentBorrowItemEntity; header: DocumentBorrowEntity }> {
    const updatedItemModel = await this.prisma.documentBorrowItemModel.update({
      where: { id: itemId },
      data: {
        returnedAt,
        status: 'RETURNED',
      },
      include: BORROW_ITEM_INCLUDE,
    });

    const allItems = await this.prisma.documentBorrowItemModel.findMany({
      where: { borrowId: updatedItemModel.borrowId },
    });

    const allReturned = allItems.every((item) => item.status === 'RETURNED' || item.returnedAt !== null);
    const headerStatus = allReturned ? 'RETURNED' : 'PARTIALLY_RETURNED';

    const headerModel = await this.prisma.documentBorrowModel.update({
      where: { id: updatedItemModel.borrowId },
      data: { status: headerStatus },
      include: BORROW_HEADER_INCLUDE,
    });

    return {
      item: DocumentBorrowItemMapper.toDomain(updatedItemModel),
      header: DocumentBorrowMapper.toDomain(headerModel),
    };
  }
}
