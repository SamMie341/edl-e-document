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
import { Roles } from 'src/core/auth/decorators/roles.decorator';
import { Role } from 'src/core/auth/constants/role.enum';
import { CreateShelfUseCase } from '../../application/use-cases/create-shelf.use-case';
import { GetAllShelvesUseCase } from '../../application/use-cases/get-all-shelves.use-case';
import { UpdateShelfUseCase } from '../../application/use-cases/update-shelf.use-case';
import { DeleteShelfUseCase } from '../../application/use-cases/delete-shelf.use-case';
import { GetShelfByIdUseCase } from '../../application/use-cases/get-shelf-by-id.use-case';
import { GetDropdownShelvesUseCase } from '../../application/use-cases/get-dropdown-shelves.use-case';
import { CreateShelvesDto } from '../../application/dtos/create-shelf.dto';
import { UpdateShelfDto } from '../../application/dtos/update-shelf.dto';

@Controller('shelves')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShelfController {
  constructor(
    private readonly createShelfUseCase: CreateShelfUseCase,
    private readonly getAllShelvesUseCase: GetAllShelvesUseCase,
    private readonly getShelfByIdUseCase: GetShelfByIdUseCase,
    private readonly getDropdownShelvesUseCase: GetDropdownShelvesUseCase,
    private readonly updateShelfUseCase: UpdateShelfUseCase,
    private readonly deleteShelfUseCase: DeleteShelfUseCase,
  ) { }

  @Post('locker/:lockerId')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  async create(
    @Param('lockerId') lockerId: string,
    @Body() dto: CreateShelvesDto,
    @Req() req: any,
  ) {
    const shelves = await this.createShelfUseCase.execute(
      { ...dto, lockerId },
      req.user,
    );
    return { message: 'ເພີ່ມຊັ້ນວາງສຳເລັດ', data: shelves };
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async findAll(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('lockerId') lockerId?: string,
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

    const result = await this.getAllShelvesUseCase.execute({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      search,
      lockerId,
      warehouseId,
      departmentId,
      divisionId,
      status,
    });
    return { message: 'Success', ...result };
  }

  // ─── GET DROPDOWN ────────────────────────────────────────────────────────────
  @Get('dropdown')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async getDropdown(
    @Req() req: any,
    @Query('lockerId') lockerId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const user = req.user;
    let departmentId: number | undefined;
    let divisionId: number | undefined;

    if (user.role === Role.BRANCH_ADMIN) {
      departmentId = user.departmentId || -1;
    } else if (user.role === Role.USER) {
      divisionId = user.divisionId || -1;
    }

    const data = await this.getDropdownShelvesUseCase.execute({
      lockerId,
      warehouseId,
      departmentId,
      divisionId,
      status,
      search,
    });
    return { message: 'Success', data };
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  async findById(@Param('id') id: string) {
    const shelf = await this.getShelfByIdUseCase.execute(id);
    return { message: 'Success', data: shelf };
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateShelfDto,
    @Req() req: any,
  ) {
    const shelf = await this.updateShelfUseCase.execute(id, dto, req.user);
    return { message: 'ອັບເດດຊັ້ນວາງສຳເລັດ', data: shelf };
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  async delete(@Param('id') id: string) {
    await this.deleteShelfUseCase.execute(id);
    return { message: 'ລົບຊັ້ນວາງສຳເລັດ' };
  }
}
