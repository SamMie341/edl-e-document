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
import { CreateLockerUseCase } from '../../application/use-cases/create-locker.use-case';
import { GetAllLockersUseCase } from '../../application/use-cases/get-all-lockers.use-case';
import { UpdateLockerUseCase } from '../../application/use-cases/update-locker.use-case';
import { DeleteLockerUseCase } from '../../application/use-cases/delete-locker.use-case';
import { GetLockerByIdUseCase } from '../../application/use-cases/get-locker-by-id.use-case';
import { GetDropdownLockersUseCase } from '../../application/use-cases/get-dropdown-lockers.use-case';
import { CreateLockerDto } from '../../application/dtos/create-locker.dto';
import { UpdateLockerDto } from '../../application/dtos/update-locker.dto';
import { Roles } from 'src/core/auth/decorators/roles.decorator';
import { Role } from 'src/core/auth/constants/role.enum';

@Controller('lockers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LockerController {
  constructor(
    private readonly createLockerUseCase: CreateLockerUseCase,
    private readonly getAllLockerUseCase: GetAllLockersUseCase,
    private readonly updateLockerUseCase: UpdateLockerUseCase,
    private readonly deleteLockerUseCase: DeleteLockerUseCase,
    private readonly getLockerByIdUseCase: GetLockerByIdUseCase,
    private readonly getDropdownLockersUseCase: GetDropdownLockersUseCase,
  ) { }

  // ─── GET ALL (paginated + filter) — HQ ເຫັນທັງໝົດ, Branch ເຫັນສະເພາະຕົນ ──
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  @Get()
  async findAll(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
  ) {
    const user = req.user;
    let departmentId: number | undefined;
    let divisionId: number | undefined;

    if (user.role === Role.BRANCH_ADMIN) {
      departmentId = user.departmentId || -1;
    } else if (user.role === Role.USER) {
      divisionId = user.divisionId || -1;
    }

    const result = await this.getAllLockerUseCase.execute({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search,
      warehouseId,
      departmentId,
      divisionId,
      status,
    });
    return { message: 'Success', ...result };
  }

  // ─── GET DROPDOWN ────────────────────────────────────────────────────────────
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  @Get('dropdown')
  async getDropdown(
    @Req() req: any,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
  ) {
    const user = req.user;
    let departmentId: number | undefined;
    let divisionId: number | undefined;

    if (user.role === Role.BRANCH_ADMIN) {
      departmentId = user.departmentId || -1;
    } else if (user.role === Role.USER) {
      divisionId = user.divisionId || -1;
    }

    const data = await this.getDropdownLockersUseCase.execute({
      warehouseId,
      departmentId,
      divisionId,
      status,
    });
    return { message: 'Success', data };
  }

  // ─── GET BY ID ─────────────────────────────────────────────────────────────
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  @Get(':id')
  async findById(@Param('id') id: string) {
    const locker = await this.getLockerByIdUseCase.execute(id);
    return { message: 'Success', data: locker };
  }

  // ─── CREATE — HQ & BRANCH ──────────────────────────────────────────────────
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  @Post()
  async create(@Body() dto: CreateLockerDto, @Req() req: any) {
    const locker = await this.createLockerUseCase.execute(dto, req.user);
    return { message: 'ເພີ່ມຕູ້ Locker ສຳເລັດ', data: locker };
  }

  // ─── UPDATE — HQ & BRANCH ──────────────────────────────────────────────────
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLockerDto,
    @Req() req: any,
  ) {
    const locker = await this.updateLockerUseCase.execute(id, dto, req.user);
    return { message: 'ອັບເດດຕູ້ Locker ສຳເລັດ', data: locker };
  }

  // ─── DELETE — HQ ເທົ່ານັ້ນ ─────────────────────────────────────────────────
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    await this.deleteLockerUseCase.execute(id, req.user);
    return { message: 'ລົບຕູ້ Locker ສຳເລັດ' };
  }
}
