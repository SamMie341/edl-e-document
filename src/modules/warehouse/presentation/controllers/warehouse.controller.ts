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
import { GetWarehousesByBranchUseCase } from '../../application/use-cases/get-warehouse-by-branch.use-case';
import { GetAllWarehouseUseCase } from '../../application/use-cases/get-all-warehouse.use-case';
import { UpdateWarehouseUseCase } from '../../application/use-cases/update-warehouse.use-case';
import { DeleteWarehouseUseCase } from '../../application/use-cases/delete-warehouse.use-case';
import { Roles } from 'src/core/auth/decorators/roles.decorator';
import { Role } from 'src/core/auth/constants/role.enum';
import { CreateWarehouseDto } from '../../application/dtos/create-warehouse.dto';
import { UpdateWarehouseDto } from '../../application/dtos/update-warehouse.dto';
import { GetWarehouseBranchDropdownUseCase } from '../../application/use-cases/get-warehouse-branch-dropdown.use-case';

@Controller('warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehouseController {
  constructor(
    private readonly createWarehouseUseCase: CreateWarehouseUseCase,
    private readonly getAllWarehouseUseCase: GetAllWarehouseUseCase,
    private readonly getWarehouseByBranchUseCase: GetWarehousesByBranchUseCase,
    private readonly updateWarehouseUseCase: UpdateWarehouseUseCase,
    private readonly deleteWarehouseUseCase: DeleteWarehouseUseCase,
    private readonly getWarehouseBranchDropdownUseCase: GetWarehouseBranchDropdownUseCase,
  ) {}

  @Roles(Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  @Get('branches/dropdown')
  async getBranchDropdown(@Req() req: any) {
    const branches = await this.getWarehouseBranchDropdownUseCase.execute(
      req.user,
    );
    return { message: 'Success', data: branches };
  }

  @Roles(Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  @Get()
  async findAll(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('branchId') branchId?: string,
    @Query('divisionId') divisionId?: string,
    @Query('status') status?: string,
  ) {
    const user = req.user;

    const isGlobalRole = user.role === Role.HQ_ADMIN;

    const parsedBranchId =
      branchId !== undefined && branchId !== ''
        ? parseInt(branchId)
        : undefined;
    const parsedDivisionId =
      divisionId !== undefined && divisionId !== ''
        ? parseInt(divisionId)
        : undefined;

    const finalBranchId = isGlobalRole
      ? parsedBranchId !== undefined && !isNaN(parsedBranchId)
        ? parsedBranchId
        : undefined
      : user.branchId
        ? parseInt(String(user.branchId))
        : -1;

    const finalDivisionId = isGlobalRole
      ? parsedDivisionId !== undefined && !isNaN(parsedDivisionId)
        ? parsedDivisionId
        : undefined
      : user.divisionId
        ? parseInt(String(user.divisionId))
        : undefined;

    const result = await this.getAllWarehouseUseCase.execute({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search,
      branchId: finalBranchId,
      divisionId: finalDivisionId,
      status,
    });

    return { message: 'Success', ...result };
  }

  // ─── GET by branch — HQ ເຫັນທຸກ branch, Branch ເຫັນສະເພາະຕົນ ────────────
  @Roles(Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  @Get('branch')
  async getByBranch(@Req() req: any) {
    const user = req.user;
    const branchId = user.branchId;
    const warehouses = await this.getWarehouseByBranchUseCase.execute(branchId);
    return { message: 'Success', data: warehouses };
  }

  // ─── CREATE — HQ ສ້າງໄດ້ທຸກ branch, Branch ສ້າງໄດ້ສະເພາະຕົນ ─────────────
  @Roles(Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  @Post()
  async create(@Body() dto: CreateWarehouseDto, @Req() req: any) {
    const warehouse = await this.createWarehouseUseCase.execute(dto, req.user);
    return { message: 'ເພີ່ມສາງສຳເລັດ', data: warehouse };
  }

  // ─── UPDATE — HQ ແກ້ໄຂໄດ້ທຸກ, Branch ແກ້ໄຂໄດ້ສະເພາະຕົນ ─────────────────
  @Roles(Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseDto,
    @Req() req: any,
  ) {
    const warehouse = await this.updateWarehouseUseCase.execute(
      id,
      dto,
      req.user,
    );
    return { message: 'ອັບເດດສາງສຳເລັດ', data: warehouse };
  }

  // ─── DELETE — HQ ເທົ່ານັ້ນ ─────────────────────────────────────────────────
  @Roles(Role.HQ_ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.deleteWarehouseUseCase.execute(id);
    return { message: 'ລົບສາງສຳເລັດ' };
  }
}
