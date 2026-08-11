import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/core/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/auth/guards/roles.guard';
import { Roles } from 'src/core/auth/decorators/roles.decorator';
import { Role } from 'src/core/auth/constants/role.enum';
import { QueryAuditLogDto } from '../../application/dtos/query-audit-log.dto';
import { GetAuditLogsUseCase } from '../../application/use-cases/get-audit-logs.use-case';
import { GetAuditLogByIdUseCase } from '../../application/use-cases/get-audit-log-by-id.use-case';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(
    private readonly getAuditLogsUseCase: GetAuditLogsUseCase,
    private readonly getAuditLogByIdUseCase: GetAuditLogByIdUseCase,
  ) {}

  /**
   * GET /audit
   * ດຶງຂໍ້ມູນ Audit Logs ພ້ອມ Filter และ Pagination
   */
  @Get()
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  async getAuditLogs(@Req() req: any, @Query() query: QueryAuditLogDto) {
    const user = req.user;
    const result = await this.getAuditLogsUseCase.execute(
      query,
      user.role,
      user.departmentId,
    );
    return {
      message: 'Success',
      ...result,
    };
  }

  /**
   * GET /audit/entity/:entityId
   * ດຶງປະຫວັດ Audit Logs ຂອງ Entity (เช่น Document ID)
   */
  @Get('entity/:entityId')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async getAuditLogsByEntityId(@Param('entityId') entityId: string) {
    const data = await this.getAuditLogByIdUseCase.findByEntityId(entityId);
    return {
      message: 'Success',
      data,
    };
  }

  /**
   * GET /audit/:id
   * ດຶງຂໍ້ມູນ Audit Log ດ່ຽວຕາມ ID
   */
  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  async getAuditLogById(@Param('id') id: string) {
    const data = await this.getAuditLogByIdUseCase.execute(id);
    return {
      message: 'Success',
      data,
    };
  }
}
