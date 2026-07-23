import { Controller, Get, Post, Put, Delete, Body, Param, Req, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from 'src/core/auth/guards/jwt-auth.guard';
import { GetDepartmentsUseCase } from '../../application/use-cases/get-department.use-case';
import { GetDepartmentByIdUseCase } from '../../application/use-cases/get-department-by-id.use-case';
import { CreateDepartmentUseCase } from '../../application/use-cases/create-department.use-case';
import { UpdateDepartmentUseCase } from '../../application/use-cases/update-department.use-case';
import { DeleteDepartmentUseCase } from '../../application/use-cases/delete-department.use-case';
import { CreateDepartmentDto } from '../../application/dtos/create-department.dto';
import { UpdateDepartmentDto } from '../../application/dtos/update-department.dto';
import { Roles } from 'src/core/auth/decorators/roles.decorator';
import { Role } from 'src/core/auth/constants/role.enum';
import { SyncDepartmentUseCase } from '../../application/use-cases/sync-department.use-case';
import { RolesGuard } from 'src/core/auth/guards/roles.guard';

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentController {
  constructor(
    private readonly getDepartmentsUseCase: GetDepartmentsUseCase,
    private readonly getDepartmentByIdUseCase: GetDepartmentByIdUseCase,
    private readonly createDepartmentUseCase: CreateDepartmentUseCase,
    private readonly updateDepartmentUseCase: UpdateDepartmentUseCase,
    private readonly deleteDepartmentUseCase: DeleteDepartmentUseCase,
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

  // ─── GET BY ID ─────────────────────────────────────────────────────────────
  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async getById(@Param('id') id: string) {
    const data = await this.getDepartmentByIdUseCase.execute(Number(id));
    return { message: 'Success', data };
  }

  // ─── CREATE ────────────────────────────────────────────────────────────────
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN)
  async create(@Body() dto: CreateDepartmentDto) {
    const data = await this.createDepartmentUseCase.execute(dto);
    return { message: 'ເພີ່ມຝ່າຍສຳເລັດ', data };
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────
  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    const data = await this.updateDepartmentUseCase.execute(Number(id), dto);
    return { message: 'ແກ້ໄຂຝ່າຍສຳເລັດ', data };
  }

  // ─── DELETE ────────────────────────────────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN)
  async delete(@Param('id') id: string) {
    await this.deleteDepartmentUseCase.execute(Number(id));
    return { message: 'ລຶບຝ່າຍສຳເລັດ' };
  }
}
