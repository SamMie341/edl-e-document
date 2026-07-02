import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/core/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/auth/guards/roles.guard';
import { Roles } from 'src/core/auth/decorators/roles.decorator';
import { Role } from 'src/core/auth/constants/role.enum';
import {
  GlobalSearchUseCase,
  SEARCH_ENTITY_TYPES,
  SearchEntityType,
} from '../../application/use-cases/global-search.use-case';
import { PrismaService } from 'src/core/database/prisma.service';

@Controller('search')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SearchController {
  constructor(
    private readonly globalSearchUseCase: GlobalSearchUseCase,
    private readonly prisma: PrismaService,
  ) {}

  // ────────────────────────────────────────────────────────────────────────────
  // GET /search
  // Global full-text search across all entities (with pagination & type filter)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * @param q         ຄຳຄົ້ນຫາ (required)
   * @param limit     ຈຳນວນຜົນລັບຕໍ່ page ຕໍ່ entity (default: 5, max: 20)
   * @param page      ໝາຍເລກ page (default: 1)
   * @param type      entity ທີ່ຕ້ອງການ, ຄັ່ນດ້ວຍ comma  ຕົວຢ່າງ: documents,folders
   *                  ຖ້າບໍ່ລະບຸ = ຄົ້ນຫາທຸກ entity
   * @param dateFrom  (documents) ກັ່ນຕອງ docDate ≥ dateFrom  ຮູບແບບ ISO 8601: 2024-01-01
   * @param dateTo    (documents) ກັ່ນຕອງ docDate ≤ dateTo    ຮູບແບບ ISO 8601: 2024-12-31
   */
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async search(
    @Req() req: any,
    @Query('q') q?: string,
    @Query('limit') limit: string = '5',
    @Query('page') page: string = '1',
    @Query('type') type?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    // ── Validate q ────────────────────────────────────────────────────────────
    if (!q || q.trim().length === 0) {
      throw new BadRequestException('ກະລຸນາລະບຸຄຳຄົ້ນຫາ (q)');
    }

    // ── Validate & parse limit ────────────────────────────────────────────────
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 5, 1), 20);

    // ── Validate & parse page ─────────────────────────────────────────────────
    const parsedPage = Math.max(parseInt(page) || 1, 1);

    // ── Validate & parse date range ──────────────────────────────────────────
    let parsedDateFrom: Date | undefined;
    let parsedDateTo: Date | undefined;

    if (dateFrom) {
      parsedDateFrom = new Date(dateFrom);
      if (isNaN(parsedDateFrom.getTime())) {
        throw new BadRequestException(`dateFrom ຮູບແບບບໍ່ຖືກຕ້ອງ: "${dateFrom}" — ໃຊ້ ISO 8601 ເຊັ່ນ: 2024-01-01`);
      }
    }
    if (dateTo) {
      parsedDateTo = new Date(dateTo);
      if (isNaN(parsedDateTo.getTime())) {
        throw new BadRequestException(`dateTo ຮູບແບບບໍ່ຖືກຕ້ອງ: "${dateTo}" — ໃຊ້ ISO 8601 ເຊັ່ນ: 2024-12-31`);
      }
      // ตั้ง dateTo เป็น end of day
      parsedDateTo.setHours(23, 59, 59, 999);
    }
    if (parsedDateFrom && parsedDateTo && parsedDateFrom > parsedDateTo) {
      throw new BadRequestException('dateFrom ຕ້ອງໜ້ອຍກວ່າ ຫຼື ເທົ່າກັບ dateTo');
    }

    // ── Validate & parse type ─────────────────────────────────────────────────
    let types: SearchEntityType[] | undefined;
    if (type && type.trim().length > 0) {
      const requested = type
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const invalid = requested.filter(
        (t) => !(SEARCH_ENTITY_TYPES as readonly string[]).includes(t),
      );
      if (invalid.length > 0) {
        throw new BadRequestException(
          `ປະເພດ entity ບໍ່ຖືກຕ້ອງ: "${invalid.join(', ')}" — ຕ້ອງເປັນໜຶ່ງໃນ: ${SEARCH_ENTITY_TYPES.join(', ')}`,
        );
      }
      types = requested as SearchEntityType[];
    }

    // ── Resolve user context ──────────────────────────────────────────────────
    const user = req.user;
    const isPrivileged =
      user.role === Role.SUPER_ADMIN || user.role === Role.HQ_ADMIN;

    let userDivisionIds: number[] | undefined;
    if (!isPrivileged) {
      const userDivs = await this.prisma.userDivisionModel.findMany({
        where: { userId: user.userId },
        select: { divisionId: true },
      });
      userDivisionIds = userDivs.map((ud) => ud.divisionId);
    }

    // ── Execute search ────────────────────────────────────────────────────────
    const results = await this.globalSearchUseCase.execute({
      q: q.trim(),
      limit: parsedLimit,
      page: parsedPage,
      types,
      dateFrom: parsedDateFrom,
      dateTo: parsedDateTo,
      userId: user.userId,
      userRole: user.role,
      userDivisionIds,
      userAddressId: user.addressId,
      userDepartmentId: user.departmentId,
    });

    return {
      message: 'Success',
      query: q.trim(),
      page: parsedPage,
      limit: parsedLimit,
      types: types ?? [...SEARCH_ENTITY_TYPES],
      ...(parsedDateFrom && { dateFrom: parsedDateFrom }),
      ...(parsedDateTo && { dateTo: parsedDateTo }),
      results,
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // GET /search/qr
  // Exact QR code lookup — ໃຊ້ສຳລັບ scan QR code ໃນ mobile app
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * @param code  QR code string (required)
   *
   * ລຳດັບການຄົ້ນຫາ: Folder → Document
   * Response: { type: 'folder' | 'document', data: { ... } }
   * ຖ້າບໍ່ພົບ → 404 NotFoundException
   */
  @Get('qr')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async searchByQr(@Query('code') code?: string) {
    if (!code || code.trim().length === 0) {
      throw new BadRequestException('ກະລຸນາລະບຸ QR code (code)');
    }

    const qr = code.trim();

    // ── 1. Folder (exact match) ───────────────────────────────────────────────
    const folder = await this.prisma.folderModel.findFirst({
      where: { qrCode: qr },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        qrCode: true,
        locationRef: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        shelf: {
          select: {
            id: true,
            name: true,
            maxQty: true,
            locker: {
              select: {
                id: true,
                code: true,
                name: true,
                warehouse: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                    address: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (folder) {
      return { message: 'Success', type: 'folder' as const, data: folder };
    }

    // ── 2. Document (exact match) ─────────────────────────────────────────────
    const document = await this.prisma.documentModel.findFirst({
      where: { qrCode: qr },
      select: {
        id: true,
        docNo: true,
        subDocNo: true,
        title: true,
        shortName: true,
        docDate: true,
        docExpire: true,
        isContractBound: true,
        qrCode: true,
        createdAt: true,
        updatedAt: true,
        documentType: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        division: { select: { id: true, name: true } },
        user: {
          select: {
            id: true,
            empCode: true,
            firstNameLa: true,
            lastNameLa: true,
          },
        },
        folder: {
          select: {
            id: true,
            code: true,
            name: true,
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
                        address: { select: { id: true, name: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (document) {
      return { message: 'Success', type: 'document' as const, data: document };
    }

    // ── 3. Not found ─────────────────────────────────────────────────────────
    throw new NotFoundException(
      `ບໍ່ພົບ QR code "${qr}" ໃນລະບົບ — ກວດສອບວ່າ code ຖືກຕ້ອງ`,
    );
  }
}
