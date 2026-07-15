import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';

// ─── Valid entity types ────────────────────────────────────────────────────────
export const SEARCH_ENTITY_TYPES = [
  'documents',
  'folders',
  'warehouses',
  'lockers',
  'shelves',
  'users',
  'departments',
  'divisions',
  'document-types',
] as const;

export type SearchEntityType = (typeof SEARCH_ENTITY_TYPES)[number];

// ─── Input / Output types ──────────────────────────────────────────────────────
export interface GlobalSearchParams {
  q: string;
  limit?: number;
  page?: number;
  types?: SearchEntityType[];     // ถ้าไม่ระบุ = ค้นทุก entity
  dateFrom?: Date;                // กรอง docDate (documents เท่านั้น)
  dateTo?: Date;                  // กรอง docDate (documents เท่านั้น)
  userId?: string;
  userRole?: string;
  userDivisionIds?: number[];
  userDepartmentId?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;    // จำนวนใน page นี้
  page: number;
  limit: number;
  hasMore: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Fetch limit+1 records เพื่อ detect hasMore โดยไม่ต้องทำ COUNT query แยก */
function paginateResult<T>(rows: T[], limit: number, page: number): PaginatedResult<T> {
  const hasMore = rows.length > limit;
  return {
    data: hasMore ? rows.slice(0, limit) : rows,
    total: hasMore ? limit : rows.length,
    page,
    limit,
    hasMore,
  };
}

/**
 * คำนวณ Retention Status จาก docDate และ isContractBound
 * (logic เดียวกับ DocumentEntity.retentionStatus getter)
 */
function calcRetentionStatus(
  docDate: Date,
  isContractBound: boolean,
): string {
  if (isContractBound) return 'DESTROYABLE_HOLD';

  const now = new Date();
  const d = new Date(docDate);
  let age = now.getFullYear() - d.getFullYear();
  const monthDiff = now.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) {
    age--;
  }

  if (age < 10) return 'ACTIVE';
  if (age === 10) return 'DESTROYABLE';
  return 'EXPIRED';
}

/**
 * ตรวจสอบว่า query ตรงกับ field ไหนบ้าง (case-insensitive)
 * Return array ของชื่อ field ที่ match
 */
function detectMatchedFields(
  q: string,
  fields: Record<string, string | null | undefined>,
): string[] {
  const lower = q.toLowerCase();
  return Object.entries(fields)
    .filter(([, val]) => val && val.toLowerCase().includes(lower))
    .map(([key]) => key);
}

// ─── Use Case ─────────────────────────────────────────────────────────────────
@Injectable()
export class GlobalSearchUseCase {
  constructor(private readonly prisma: PrismaService) { }

  async execute(params: GlobalSearchParams) {
    const {
      q,
      limit = 5,
      page = 1,
      types,
      dateFrom,
      dateTo,
      userId,
      userRole,
      userDivisionIds,
      userDepartmentId,
    } = params;

    const isPrivileged = userRole === 'SUPER_ADMIN' || userRole === 'HQ_ADMIN';
    const mode = 'insensitive' as const;
    const skip = (page - 1) * limit;
    const take = limit + 1; // +1 เพื่อ detect hasMore

    // ถ้าไม่ระบุ types ให้ search ทุก entity
    const activeTypes = types && types.length > 0 ? new Set(types) : new Set(SEARCH_ENTITY_TYPES);
    const wants = (t: SearchEntityType) => activeTypes.has(t);

    // ─── Division-scoped filter ──────────────────────────────────────────────
    const divisionWhere =
      !isPrivileged && userDivisionIds && userDivisionIds.length > 0
        ? { in: userDivisionIds }
        : undefined;

    // ─── Date range filter for documents ────────────────────────────────────
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (dateFrom) dateFilter.gte = dateFrom;
    if (dateTo) dateFilter.lte = dateTo;
    const hasDateFilter = dateFrom || dateTo;

    // ─── Run only needed queries in parallel ─────────────────────────────────
    const [
      docRows,
      folderRows,
      warehouseRows,
      lockerRows,
      shelfRows,
      userRows,
      departmentRows,
      divisionRows,
      documentTypeRows,
    ] = await Promise.all([
      // ── Documents ───────────────────────────────────────────────────────────
      wants('documents')
        ? this.prisma.documentModel.findMany({
          where: {
            AND: [
              ...(divisionWhere ? [{ divisionId: divisionWhere }] : []),
              ...(hasDateFilter ? [{ docDate: dateFilter }] : []),
              {
                OR: [
                  { docNo: { contains: q, mode } },
                  { title: { contains: q, mode } },
                  { shortName: { contains: q, mode } },
                  { description: { contains: q, mode } },
                  { subDocuments: { some: { subDocNo: { contains: q, mode } } } },
                  { division: { name: { contains: q, mode } } },
                  { department: { name: { contains: q, mode } } },
                  { documentType: { name: { contains: q, mode } } },
                  { user: { firstNameLa: { contains: q, mode } } },
                  { user: { lastNameLa: { contains: q, mode } } },
                  { user: { firstNameEng: { contains: q, mode } } },
                  { user: { lastNameEng: { contains: q, mode } } },
                ],
              },
            ],
          },
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            docNo: true,
            title: true,
            shortName: true,
            description: true,
            docDate: true,
            docExpire: true,
            isContractBound: true,
            subDocuments: { select: { id: true, subDocNo: true, subDocDate: true }, orderBy: { createdAt: 'asc' } },
            division: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
            documentType: { select: { id: true, name: true } },
            user: { select: { id: true, firstNameLa: true, lastNameLa: true, empCode: true } },
            // ── ข้อ 4: borrow status ──────────────────────────────────────
            borrows: {
              where: { returnedAt: null },
              take: 1,
              orderBy: { borrowedAt: 'desc' },
              select: {
                id: true,
                borrower: true,
                borrowedAt: true,
                purpose: true,
                toDivision: { select: { id: true, name: true } },
              },
            },
          },
        })
        : Promise.resolve(null),

      // ── Folders ─────────────────────────────────────────────────────────────
      wants('folders')
        ? this.prisma.folderModel.findMany({
          where: {
            AND: [
              ...(
                !isPrivileged && userDepartmentId
                  ? [{ shelf: { locker: { warehouse: { departmentId: userDepartmentId } } } }]
                  : []
              ),
              {
                OR: [
                  { code: { contains: q, mode } },
                  { name: { contains: q, mode } },
                  { description: { contains: q, mode } },
                  { locationRef: { contains: q, mode } },
                ],
              },
            ],
          },
          skip,
          take,
          orderBy: { code: 'asc' },
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            locationRef: true,
            qrCode: true,
            shelf: {
              select: {
                id: true,
                name: true,
                locker: {
                  select: {
                    id: true,
                    name: true,
                    warehouse: {
                      select: {
                        id: true,
                        name: true,
                        department: { select: { id: true, name: true } },
                        division: { select: { id: true, name: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        })
        : Promise.resolve(null),

      // ── Warehouses ──────────────────────────────────────────────────────────
      wants('warehouses')
        ? this.prisma.warehouseModel.findMany({
          where: {
            AND: [
              { status: 'A' },
              ...(
                !isPrivileged && userDepartmentId
                  ? [{ departmentId: userDepartmentId }]
                  : []
              ),
              {
                OR: [
                  { code: { contains: q, mode } },
                  { name: { contains: q, mode } },
                  { description: { contains: q, mode } },
                  { department: { name: { contains: q, mode } } },
                  { division: { name: { contains: q, mode } } },
                ],
              },
            ],
          },
          skip,
          take,
          orderBy: { name: 'asc' },
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            status: true,
            department: { select: { id: true, name: true } },
            division: { select: { id: true, name: true } },
          },
        })
        : Promise.resolve(null),

      // ── Lockers ─────────────────────────────────────────────────────────────
      wants('lockers')
        ? this.prisma.lockerModel.findMany({
          where: {
            AND: [
              { status: 'A' },
              ...(
                !isPrivileged && userDepartmentId
                  ? [{ warehouse: { departmentId: userDepartmentId } }]
                  : []
              ),
              {
                OR: [
                  { code: { contains: q, mode } },
                  { name: { contains: q, mode } },
                  { description: { contains: q, mode } },
                ],
              },
            ],
          },
          skip,
          take,
          orderBy: { code: 'asc' },
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            status: true,
            warehouse: {
              select: {
                id: true,
                name: true,
                department: { select: { id: true, name: true } },
                division: { select: { id: true, name: true } },
              },
            },
          },
        })
        : Promise.resolve(null),

      // ── Shelves ─────────────────────────────────────────────────────────────
      wants('shelves')
        ? this.prisma.shelfModel.findMany({
          where: {
            AND: [
              { status: 'A' },
              ...(
                !isPrivileged && userDepartmentId
                  ? [{ locker: { warehouse: { departmentId: userDepartmentId } } }]
                  : []
              ),
              {
                OR: [
                  { name: { contains: q, mode } },
                  { description: { contains: q, mode } },
                ],
              },
            ],
          },
          skip,
          take,
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            maxQty: true,
            status: true,
            locker: {
              select: {
                id: true,
                code: true,
                name: true,
                warehouse: {
                  select: {
                    id: true,
                    name: true,
                    department: { select: { id: true, name: true } },
                    division: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        })
        : Promise.resolve(null),

      // ── Users (SUPER_ADMIN & HQ_ADMIN only) ─────────────────────────────────
      wants('users') && isPrivileged
        ? this.prisma.userModel.findMany({
          where: {
            OR: [
              { empCode: { contains: q, mode } },
              { firstNameLa: { contains: q, mode } },
              { lastNameLa: { contains: q, mode } },
              { firstNameEng: { contains: q, mode } },
              { lastNameEng: { contains: q, mode } },
              { email: { contains: q, mode } },
              { phone: { contains: q, mode } },
            ],
          },
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            empCode: true,
            firstNameLa: true,
            lastNameLa: true,
            firstNameEng: true,
            lastNameEng: true,
            email: true,
            role: true,
            status: true,
            department: { select: { id: true, name: true } },
          },
        })
        : Promise.resolve(null),


      // ── Departments ─────────────────────────────────────────────────────────
      wants('departments')
        ? this.prisma.departmentModel.findMany({
          where: {
            AND: [
              { status: 'A' },
              ...(
                !isPrivileged && userDepartmentId
                  ? [{ id: userDepartmentId }]
                  : []
              ),
              {
                OR: [
                  { code: { contains: q, mode } },
                  { name: { contains: q, mode } },
                ],
              },
            ],
          },
          skip,
          take,
          orderBy: { name: 'asc' },
          select: {
            id: true,
            code: true,
            name: true,
            email: true,
            phone: true,
            status: true,
          },
        })
        : Promise.resolve(null),

      // ── Divisions ────────────────────────────────────────────────────────────
      wants('divisions')
        ? this.prisma.divisionModel.findMany({
          where: {
            AND: [
              { status: 'A' },
              ...(
                !isPrivileged && userDivisionIds && userDivisionIds.length > 0
                  ? [{ id: { in: userDivisionIds } }]
                  : []
              ),
              {
                OR: [
                  { code: { contains: q, mode } },
                  { name: { contains: q, mode } },
                  { shortName: { contains: q, mode } },
                ],
              },
            ],
          },
          skip,
          take,
          orderBy: { name: 'asc' },
          select: {
            id: true,
            code: true,
            name: true,
            shortName: true,
            status: true,
            department: { select: { id: true, name: true } },
          },
        })
        : Promise.resolve(null),

      // ── Document Types ──────────────────────────────────────────────────────
      wants('document-types')
        ? this.prisma.documentTypeModel.findMany({
          where: {
            OR: [
              { code: { contains: q, mode } },
              { name: { contains: q, mode } },
              { description: { contains: q, mode } },
            ],
          },
          skip,
          take,
          orderBy: { name: 'asc' },
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
          },
        })
        : Promise.resolve(null),
    ]);

    // ─── Post-process documents ───────────────────────────────────────────────
    const processedDocs = docRows
      ? docRows.map((doc) => {
        // ── ข้อ 4: Borrow status ─────────────────────────────────────────
        const activeBorrow = doc.borrows?.[0] ?? null;
        const borrowStatus = activeBorrow
          ? { isBorrowed: true, borrowedBy: activeBorrow.borrower, borrowedAt: activeBorrow.borrowedAt, purpose: activeBorrow.purpose ?? null, toDivision: activeBorrow.toDivision ?? null }
          : { isBorrowed: false, borrowedBy: null, borrowedAt: null, purpose: null, toDivision: null };

        // ── ข้อ 6 (ส่วนหนึ่ง): Retention status ─────────────────────────
        const retentionStatus = calcRetentionStatus(doc.docDate, doc.isContractBound);

        // ── ข้อ 8: Matched fields ────────────────────────────────────────
        const matchedIn = detectMatchedFields(q, {
          docNo: doc.docNo,
          title: doc.title,
          shortName: doc.shortName ?? null,
          description: doc.description ?? null,
          divisionName: doc.division?.name ?? null,
          departmentName: doc.department?.name ?? null,
          documentTypeName: doc.documentType?.name ?? null,
          ownerFirstName: doc.user?.firstNameLa ?? null,
          ownerLastName: doc.user?.lastNameLa ?? null,
        });

        const { borrows: _borrows, ...docFields } = doc;
        return { ...docFields, retentionStatus, borrowStatus, matchedIn };
      })
      : null;

    // ─── Post-process folders (ข้อ 8 only) ──────────────────────────────────
    const processedFolders = folderRows
      ? folderRows.map((folder) => ({
        ...folder,
        matchedIn: detectMatchedFields(q, {
          code: folder.code,
          name: folder.name,
          description: folder.description ?? null,
          locationRef: folder.locationRef ?? null,
        }),
      }))
      : null;

    // ─── Post-process users (ข้อ 8 only) ────────────────────────────────────
    const processedUsers = userRows
      ? userRows.map((user) => ({
        ...user,
        matchedIn: detectMatchedFields(q, {
          empCode: user.empCode ?? null,
          firstNameLa: user.firstNameLa ?? null,
          lastNameLa: user.lastNameLa ?? null,
          firstNameEng: (user as any).firstNameEng ?? null,
          lastNameEng: (user as any).lastNameEng ?? null,
          email: (user as any).email ?? null,
          phone: (user as any).phone ?? null,
        }),
      }))
      : null;

    // ─── Post-process document-types (ข้อ 8 only) ───────────────────────────
    const processedDocTypes = documentTypeRows
      ? documentTypeRows.map((docType) => ({
        ...docType,
        matchedIn: detectMatchedFields(q, {
          code: docType.code ?? null,
          name: docType.name,
          description: docType.description ?? null,
        }),
      }))
      : null;

    // ─── Build paginated response ─────────────────────────────────────────────
    return {
      documents: processedDocs !== null ? paginateResult(processedDocs, limit, page) : undefined,
      folders: processedFolders !== null ? paginateResult(processedFolders, limit, page) : undefined,
      warehouses: warehouseRows !== null ? paginateResult(warehouseRows, limit, page) : undefined,
      lockers: lockerRows !== null ? paginateResult(lockerRows, limit, page) : undefined,
      shelves: shelfRows !== null ? paginateResult(shelfRows, limit, page) : undefined,
      users: processedUsers !== null ? paginateResult(processedUsers, limit, page) : undefined,
      addresses: undefined,
      departments: departmentRows !== null ? paginateResult(departmentRows, limit, page) : undefined,
      divisions: divisionRows !== null ? paginateResult(divisionRows, limit, page) : undefined,
      'document-types': processedDocTypes !== null ? paginateResult(processedDocTypes, limit, page) : undefined,
    };
  }
}
