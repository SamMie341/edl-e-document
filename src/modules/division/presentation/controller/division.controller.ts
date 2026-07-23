import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from 'src/core/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/auth/guards/roles.guard';
import { Roles } from 'src/core/auth/decorators/roles.decorator';
import { Role } from 'src/core/auth/constants/role.enum';
import { SyncDivisionUseCase } from '../../application/use-cases/sync-divisions.use-case';
import { GetDivisionsUseCase } from '../../application/use-cases/get-division.use-case';
import { GetDivisionsByDepartmentUseCase } from '../../application/use-cases/get-divisions-by-department.use-case';
import { GetDivisionByIdUseCase } from '../../application/use-cases/get-division-by-id.use-case';
import { CreateDivisionUseCase } from '../../application/use-cases/create-division.use-case';
import { UpdateDivisionUseCase } from '../../application/use-cases/update-division.use-case';
import { DeleteDivisionUseCase } from '../../application/use-cases/delete-division.use-case';
import { CreateDivisionDto } from '../../application/dtos/create-division.dto';
import { UpdateDivisionDto } from '../../application/dtos/update-division.dto';

@Controller('divisions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DivisionController {
  constructor(
    private readonly syncDivisionUseCase: SyncDivisionUseCase,
    private readonly getDivisionUseCase: GetDivisionsUseCase,
    private readonly getDivisionsByDepartmentUseCase: GetDivisionsByDepartmentUseCase,
    private readonly getDivisionByIdUseCase: GetDivisionByIdUseCase,
    private readonly createDivisionUseCase: CreateDivisionUseCase,
    private readonly updateDivisionUseCase: UpdateDivisionUseCase,
    private readonly deleteDivisionUseCase: DeleteDivisionUseCase,
  ) { }

  @Get()
  async getAllDivisions() {
    const data = await this.getDivisionUseCase.execute();
    return {
      message: 'Success',
      data: data,
    };
  }

  // ─── DROPDOWN: filter by departmentId, return id + name ───────────────────
  @Get('dropdown')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async getDivisionDropdown(
    @Req() req: any,
    @Query('departmentId') departmentId?: string,
  ) {
    // BRANCH_ADMIN: ອ່ານ departmentId ຈາກ token ໂດຍອັດຕະໂນມັດ (ບໍ່ຕ້ອງ pass query param)
    const user = req.user;
    const effectiveDeptId =
      user.role === Role.BRANCH_ADMIN
        ? user.departmentId
        : departmentId
          ? Number(departmentId)
          : undefined;

    let data;
    if (effectiveDeptId) {
      data = await this.getDivisionsByDepartmentUseCase.execute(effectiveDeptId);
    } else {
      data = await this.getDivisionUseCase.execute();
    }

    return {
      message: 'Success',
      data: data.map((d) => ({ id: d.id, code: d.code, name: d.name, shortName: d.shortName, status: d.status })),
    };
  }

  @Get('department/:departmentId')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async getDivisionsByDepartment(@Param('departmentId') departmentId: string) {
    const data = await this.getDivisionsByDepartmentUseCase.execute(Number(departmentId));
    return {
      message: 'Success',
      data: data
    };
  }

  @Post('sync')
  @Roles(Role.SUPER_ADMIN)
  async sync() {
    return await this.syncDivisionUseCase.execute();
  }

  // ─── GET BY ID ─────────────────────────────────────────────────────────────
  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async getById(@Param('id') id: string) {
    const data = await this.getDivisionByIdUseCase.execute(Number(id));
    return { message: 'Success', data };
  }

  // ─── CREATE ────────────────────────────────────────────────────────────────
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN)
  async create(@Body() dto: CreateDivisionDto) {
    const data = await this.createDivisionUseCase.execute(dto);
    return { message: 'ເພີ່ມພະແນກສຳເລັດ', data };
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────
  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateDivisionDto) {
    const data = await this.updateDivisionUseCase.execute(Number(id), dto);
    return { message: 'ແກ້ໄຂພະແນກສຳເລັດ', data };
  }

  // ─── DELETE ────────────────────────────────────────────────────────────────
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN)
  async delete(@Param('id') id: string) {
    await this.deleteDivisionUseCase.execute(Number(id));
    return { message: 'ລຶບພະແນກສຳເລັດ' };
  }
}
