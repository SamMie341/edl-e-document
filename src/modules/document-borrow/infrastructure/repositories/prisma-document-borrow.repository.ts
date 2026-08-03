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
        phone: data.phone,
        purpose: data.purpose,
        toDivisionId: data.toDivisionId,
        toLocation: data.toLocation,
        createdById: data.createdById,
        note: data.note,
        dueDate: data.dueDate,
      },
      include: BORROW_INCLUDE,
    });
    return DocumentBorrowMapper.toDomain(model);
  }

  async createMany(data: CreateDocumentBorrowData[]): Promise<DocumentBorrowEntity[]> {
    const models = await this.prisma.$transaction(
      data.map((item) =>
        this.prisma.documentBorrowModel.create({
          data: {
            documentId: item.documentId,
            folderId: item.folderId,
            borrower: item.borrower,
            phone: item.phone,
            purpose: item.purpose,
            toDivisionId: item.toDivisionId,
            toLocation: item.toLocation,
            createdById: item.createdById,
            note: item.note,
            dueDate: item.dueDate,
          },
          include: BORROW_INCLUDE,
        })
      )
    );
    return models.map((m) => DocumentBorrowMapper.toDomain(m));
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

    if (documentId) andConditions.push({ documentId });
    if (folderId) andConditions.push({ folderId });
    if (activeOnly) andConditions.push({ returnedAt: null });
    if (status) andConditions.push({ status });

    if (type) {
      const upperType = type.toUpperCase();
      if (upperType === 'DOCUMENT') {
        andConditions.push({ documentId: { not: null } });
      } else if (upperType === 'FOLDER') {
        andConditions.push({ folderId: { not: null } });
      }
    }

    if (search) {
      andConditions.push({
        OR: [
          { borrower: { contains: search, mode: 'insensitive' } },
          { purpose: { contains: search, mode: 'insensitive' } },
          { document: { is: { title: { contains: search, mode: 'insensitive' } } } },
          { document: { is: { docNo: { contains: search, mode: 'insensitive' } } } },
          { folder: { is: { name: { contains: search, mode: 'insensitive' } } } },
          { folder: { is: { code: { contains: search, mode: 'insensitive' } } } },
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
      if (/^\d{4}-\d{2}-\d{2}$/.test(returnedAt)) {
        andConditions.push({
          returnedAt: {
            gte: new Date(`${returnedAt}T00:00:00.000Z`),
            lte: new Date(`${returnedAt}T23:59:59.999Z`),
          },
        });
      } else {
        const date = new Date(returnedAt);
        if (!isNaN(date.getTime())) {
          const yyyy = date.getUTCFullYear();
          const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
          const dd = String(date.getUTCDate()).padStart(2, '0');
          andConditions.push({
            returnedAt: {
              gte: new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`),
              lte: new Date(`${yyyy}-${mm}-${dd}T23:59:59.999Z`),
            },
          });
        }
      }
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

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

  async findActive(
    departmentId?: number,
    divisionId?: number,
    upcomingDays?: number,
  ): Promise<DocumentBorrowEntity[]> {
    const scope = buildScopeWhere(departmentId, divisionId);
    const where: any = { returnedAt: null, ...scope };

    if (upcomingDays && upcomingDays > 0) {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + upcomingDays);
      where.dueDate = {
        gte: now,
        lte: futureDate,
      };
    }

    const models = await this.prisma.documentBorrowModel.findMany({
      where,
      orderBy: [
        { dueDate: 'asc' },
        { borrowedAt: 'desc' },
      ],
      include: BORROW_INCLUDE,
    });
    return models.map(DocumentBorrowMapper.toDomain);
  }

  async return(id: string, returnedAt: Date): Promise<DocumentBorrowEntity> {
    const model = await this.prisma.documentBorrowModel.update({
      where: { id },
      data: {
        returnedAt,
        status: 'RETURNED',
      },
      include: BORROW_INCLUDE,
    });
    return DocumentBorrowMapper.toDomain(model);
  }
}
