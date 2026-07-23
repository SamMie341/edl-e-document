import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/core/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/auth/guards/roles.guard';
import { CreateWarehouseUseCase } from '../../application/use-cases/create-warehouse.use-case';
import { GetAllWarehouseUseCase } from '../../application/use-cases/get-all-warehouse.use-case';
import { UpdateWarehouseUseCase } from '../../application/use-cases/update-warehouse.use-case';
import { DeleteWarehouseUseCase } from '../../application/use-cases/delete-warehouse.use-case';
import { GetWarehouseByIdUseCase } from '../../application/use-cases/get-warehouse-by-id.use-case';
import { GetWarehouseDropdownUseCase } from '../../application/use-cases/get-warehouse-dropdown.use-case';
import { Roles } from 'src/core/auth/decorators/roles.decorator';
import { Role } from 'src/core/auth/constants/role.enum';
import { CreateWarehouseDto } from '../../application/dtos/create-warehouse.dto';
import { UpdateWarehouseDto } from '../../application/dtos/update-warehouse.dto';
import { PrismaService } from 'src/core/database/prisma.service';

@Controller('warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehouseController {
  constructor(
    private readonly createWarehouseUseCase: CreateWarehouseUseCase,
    private readonly getAllWarehouseUseCase: GetAllWarehouseUseCase,
    private readonly updateWarehouseUseCase: UpdateWarehouseUseCase,
    private readonly deleteWarehouseUseCase: DeleteWarehouseUseCase,
    private readonly getWarehouseByIdUseCase: GetWarehouseByIdUseCase,
    private readonly getWarehouseDropdownUseCase: GetWarehouseDropdownUseCase,
    private readonly prisma: PrismaService,
  ) { }

  // ─── GET ALL ─────────────────────────────────────────────────────────────────
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  @Get()
  async findAll(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const user = req.user;

    // ─── Role-based department / division scoping ──────────────────────────
    // SUPER_ADMIN & HQ_ADMIN: ເຫັນທັງໝົດ (no extra filter)
    // BRANCH_ADMIN          : ເຫັນສະເພາະ warehouse ໃນ divisions ທີ່ຕົວເອງຮັບຜິດຊອບ
    // USER                  : ເຫັນສະເພາະ warehouse ໃນ division ຂອງຕົວເອງ
    let departmentId: number | undefined;
    let divisionId: number | undefined;
    let divisionIds: number[] | undefined;

    if (user.role === Role.BRANCH_ADMIN) {
      const userDivs = await this.prisma.userDivisionModel.findMany({
        where: { userId: user.userId },
        select: { divisionId: true },
      });
      divisionIds = userDivs.map((ud) => ud.divisionId);
      if (divisionIds.length === 0) {
        divisionIds = [-1];
      }
    } else if (user.role === Role.USER) {
      divisionId = user.divisionId || -1;
    }

    const result = await this.getAllWarehouseUseCase.execute({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search,
      status,
      departmentId,
      divisionId,
      divisionIds,
    });
    return { message: 'Success', ...result };
  }

  // ─── DROPDOWN ─────────────────────────────────────────────────────────────
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  @Get('dropdown')
  async getDropdown(
    @Req() req: any,
    @Query('departmentId') departmentIdQuery?: string,
    @Query('divisionId') divisionIdQuery?: string,
  ) {
    const user = req.user;

    // ─── Role-based department / division scoping ──────────────────────────
    let departmentId: number | undefined;
    let divisionId: number | undefined;
    let divisionIds: number[] | undefined;

    if (user.role === Role.BRANCH_ADMIN) {
      const userDivs = await this.prisma.userDivisionModel.findMany({
        where: { userId: user.userId },
        select: { divisionId: true },
      });
      divisionIds = userDivs.map((ud) => ud.divisionId);
      if (divisionIds.length === 0) {
        divisionIds = [-1];
      }
      if (departmentIdQuery) {
        departmentId = parseInt(departmentIdQuery, 10);
      }
    } else if (user.role === Role.USER) {
      divisionId = user.divisionId || -1;
    } else {
      if (departmentIdQuery) departmentId = parseInt(departmentIdQuery, 10);
      if (divisionIdQuery) divisionId = parseInt(divisionIdQuery, 10);
    }

    const data = await this.getWarehouseDropdownUseCase.execute({
      departmentId,
      divisionId,
      divisionIds,
    });
    return { message: 'Success', data };
  }

  // ─── GET BY ID ─────────────────────────────────────────────────────────────
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  @Get(':id')
  async findById(@Param('id') id: string) {
    const warehouse = await this.getWarehouseByIdUseCase.execute(id);
    return { message: 'Success', data: warehouse };
  }

  // ─── CREATE ───────────────────────────────────────────────────────────────
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  @Post()
  async create(@Body() dto: CreateWarehouseDto) {
    const warehouse = await this.createWarehouseUseCase.execute(dto);
    return { message: 'ເພີ່ມສາງສຳເລັດ', data: warehouse };
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────────
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseDto,
  ) {
    const warehouse = await this.updateWarehouseUseCase.execute(id, dto);
    return { message: 'ອັບເດດສາງສຳເລັດ', data: warehouse };
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.deleteWarehouseUseCase.execute(id);
    return { message: 'ລົບສາງສຳເລັດ' };
  }
}
