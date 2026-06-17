import { Controller, Get, Post, Req, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/core/auth/guards/jwt-auth.guard';
import { GetDepartmentsUseCase } from '../../application/use-cases/get-department.use-case';
import { Roles } from 'src/core/auth/decorators/roles.decorator';
import { Role } from 'src/core/auth/constants/role.enum';
import { SyncDepartmentUseCase } from '../../application/use-cases/sync-department.use-case';
import { RolesGuard } from 'src/core/auth/guards/roles.guard';

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentController {
  constructor(
    private readonly getDepartmentsUseCase: GetDepartmentsUseCase,
    private readonly syncDepartmentUseCase: SyncDepartmentUseCase,
  ) { }

  @Get()
  async getAllDepartments() {
    const data = await this.getDepartmentsUseCase.execute();
    return {
      message: 'Success',
      data: data,
    };
  }

  // ─── DROPDOWN: id + name only ──────────────────────────────────────────────
  @Get('dropdown')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async getDepartmentDropdown(@Req() req: any) {
    const user = req.user;
    let data = await this.getDepartmentsUseCase.execute();

    // BRANCH_ADMIN: ໃຫ້ເຫັນສະເພາະ department ຂອງຕົວເອງ
    if (user.role === Role.BRANCH_ADMIN && user.departmentId) {
      data = data.filter((d) => d.id === user.departmentId);
    }

    if (user.role === Role.USER && user.departmentId) {
      data = data.filter((d) => d.id === user.departmentId);
    }

    return {
      message: 'Success',
      data: data.map((d) => ({ id: d.id, code: d.code, name: d.name })),
    };
  }

  @Post('sync')
  @Roles(Role.SUPER_ADMIN)
  async sync() {
    return await this.syncDepartmentUseCase.execute();
  }
}
