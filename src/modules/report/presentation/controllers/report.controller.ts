import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/auth/guards/roles.guard';
import { Roles } from '../../../../core/auth/decorators/roles.decorator';
import { Role } from 'src/core/auth/constants/role.enum';
import { GetDocumentReportUseCase } from '../../application/use-cases/get-document-report.use-case';
import { GetBorrowReportUseCase } from '../../application/use-cases/get-borrow-report.use-case';
import { GetRetentionReportUseCase } from '../../application/use-cases/get-retention-report.use-case';
import { GetStorageReportUseCase, StorageGroupBy } from '../../application/use-cases/get-storage-report.use-case';
import { GetAuditReportUseCase } from '../../application/use-cases/get-audit-report.use-case';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportController {
  constructor(
    private readonly getDocumentReport: GetDocumentReportUseCase,
    private readonly getBorrowReport: GetBorrowReportUseCase,
    private readonly getRetentionReport: GetRetentionReportUseCase,
    private readonly getStorageReport: GetStorageReportUseCase,
    private readonly getAuditReport: GetAuditReportUseCase,
  ) {}

  // ─── Helper: build RBAC scope filter ─────────────────────────────────────
  private buildScopeFilter(user: any): {
    forcedDepartmentId?: number;
    forcedDivisionId?: number;
  } {
    const { role, departmentId: rawDeptId, divisionId: rawDivId } = user;

    if (role === Role.BRANCH_ADMIN) {
      const parsed = Number(rawDeptId);
      return {
        forcedDepartmentId: !isNaN(parsed) && parsed > 0 ? parsed : undefined,
      };
    }

    if (role === Role.USER) {
      const parsed = Number(rawDivId);
      return {
        forcedDivisionId: !isNaN(parsed) && parsed > 0 ? parsed : undefined,
      };
    }

    return {};
  }

  // ─── GET /reports/documents — ລາຍງານເອກະສານ ───────────────────────────────
  @Get('documents')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async documentReport(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('departmentId') departmentId?: string,
    @Query('divisionId') divisionId?: string,
    @Query('documentTypeId') documentTypeId?: string,
    @Query('retentionStatus') retentionStatus?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('lockerId') lockerId?: string,
    @Query('shelfId') shelfId?: string,
    @Query('folderId') folderId?: string,
    @Query('search') search?: string,
  ) {
    const { forcedDepartmentId, forcedDivisionId } = this.buildScopeFilter(req.user);

    const result = await this.getDocumentReport.execute({
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 20, 100),
      startDate,
      endDate,
      departmentId: departmentId ? parseInt(departmentId) : undefined,
      divisionId: divisionId ? parseInt(divisionId) : undefined,
      documentTypeId,
      retentionStatus,
      warehouseId,
      lockerId,
      shelfId,
      folderId,
      search,
      forcedDepartmentId,
      forcedDivisionId,
    });

    return { message: 'Success', ...result };
  }

  // ─── GET /reports/borrows — ລາຍງານການຢືມ-ຄືນ ────────────────────────────
  @Get('borrows')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async borrowReport(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
    @Query('divisionId') divisionId?: string,
    @Query('search') search?: string,
    @Query('overdueOnly') overdueOnly?: string,
  ) {
    const { forcedDepartmentId, forcedDivisionId } = this.buildScopeFilter(req.user);

    const result = await this.getBorrowReport.execute({
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 20, 100),
      startDate,
      endDate,
      status,
      departmentId: departmentId ? parseInt(departmentId) : undefined,
      divisionId: divisionId ? parseInt(divisionId) : undefined,
      search,
      overdueOnly: overdueOnly === 'true',
      forcedDepartmentId,
      forcedDivisionId,
    });

    return { message: 'Success', ...result };
  }

  // ─── GET /reports/retention — ລາຍງານເອກະສານໝົດອາຍຸ/ຄວນທຳລາຍ ─────────────
  @Get('retention')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  async retentionReport(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('retentionStatus') retentionStatus?: string,
    @Query('departmentId') departmentId?: string,
    @Query('divisionId') divisionId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('lockerId') lockerId?: string,
    @Query('shelfId') shelfId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const { forcedDepartmentId, forcedDivisionId } = this.buildScopeFilter(req.user);

    const result = await this.getRetentionReport.execute({
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 20, 100),
      retentionStatus,
      departmentId: departmentId ? parseInt(departmentId) : undefined,
      divisionId: divisionId ? parseInt(divisionId) : undefined,
      warehouseId,
      lockerId,
      shelfId,
      startDate,
      endDate,
      forcedDepartmentId,
      forcedDivisionId,
    });

    return { message: 'Success', ...result };
  }

  // ─── GET /reports/storage — ລາຍງານຄວາມຈຸສາງ/ຕູ້/ຊັ້ນ ──────────────────────
  @Get('storage')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async storageReport(
    @Req() req: any,
    @Query('departmentId') departmentId?: string,
    @Query('divisionId') divisionId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('groupBy') groupBy?: string,
  ) {
    const { forcedDepartmentId, forcedDivisionId } = this.buildScopeFilter(req.user);

    const validGroupBy: StorageGroupBy[] = ['warehouse', 'locker', 'shelf'];
    const resolvedGroupBy: StorageGroupBy =
      validGroupBy.includes(groupBy as StorageGroupBy)
        ? (groupBy as StorageGroupBy)
        : 'warehouse';

    const result = await this.getStorageReport.execute({
      departmentId: departmentId ? parseInt(departmentId) : undefined,
      divisionId: divisionId ? parseInt(divisionId) : undefined,
      warehouseId,
      groupBy: resolvedGroupBy,
      forcedDepartmentId,
      forcedDivisionId,
    });

    return { message: 'Success', ...result };
  }

  // ─── GET /reports/audit — ລາຍງານ Audit Log ───────────────────────────────
  @Get('audit')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  async auditReport(
    @Req() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('actorId') actorId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('divisionId') divisionId?: string,
    @Query('search') search?: string,
  ) {
    const { forcedDepartmentId } = this.buildScopeFilter(req.user);

    const result = await this.getAuditReport.execute({
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 20, 100),
      startDate,
      endDate,
      action,
      entityType,
      actorId,
      departmentId: departmentId ? parseInt(departmentId) : undefined,
      divisionId: divisionId ? parseInt(divisionId) : undefined,
      search,
      forcedDepartmentId,
    });

    return { message: 'Success', ...result };
  }
}
