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
import { CreateFolderUseCase } from '../../application/use-cases/create-folder.use-case';
import { UpdateFolderUseCase } from '../../application/use-cases/update-folder.use-case';
import { DeleteFolderUseCase } from '../../application/use-cases/delete-folder.use-case';
import { Roles } from 'src/core/auth/decorators/roles.decorator';
import { Role } from 'src/core/auth/constants/role.enum';
import { CreateFolderDto } from '../../application/dtos/create-folder.dto';
import { UpdateFolderDto } from '../../application/dtos/update-folder.dto';
import { GetAllFolderUseCase } from '../../application/use-cases/get-all-folders.use-case';
import { GetFolderByIdUseCase } from '../../application/use-cases/get-folder-by-id.use-case';
import { GetFolderDropdownUseCase } from '../../application/use-cases/get-folder-dropdown.use-case';
import { PrismaService } from 'src/core/database/prisma.service';

@Controller('folders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FolderController {
  constructor(
    private readonly createFolderUseCase: CreateFolderUseCase,
    private readonly getAllFolderUseCase: GetAllFolderUseCase,
    private readonly getFolderByIdUseCase: GetFolderByIdUseCase,
    private readonly getFolderDropdownUseCase: GetFolderDropdownUseCase,
    private readonly updateFolderUseCase: UpdateFolderUseCase,
    private readonly deleteFolderUseCase: DeleteFolderUseCase,
    private readonly prisma: PrismaService,
  ) { }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.BRANCH_ADMIN, Role.HQ_ADMIN, Role.USER)
  async create(@Body() dto: CreateFolderDto) {
    const folder = await this.createFolderUseCase.execute(dto);
    return {
      message: 'ສ້າງໂກໂນສຳເລັດ',
      data: folder,
    };
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async findAll(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('shelfId') shelfId?: string,
    @Query('lockerId') lockerId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('departmentId') departmentIdQuery?: string,
    @Query('divisionId') divisionIdQuery?: string,
    @Query('search') search?: string,
  ) {
    const user = req.user;
    let departmentId: number | undefined;
    let divisionId: number | undefined;
    let divisionIds: number[] | undefined;

    if (user.role === Role.BRANCH_ADMIN) {
      const userDivs = await this.prisma.userDivisionModel.findMany({
        where: { userId: user.userId },
        select: { divisionId: true },
      });
      divisionIds = userDivs.map((ud) => ud.divisionId);
      if (divisionIds.length === 0 && user.divisionId) {
        divisionIds = [user.divisionId];
      }
      if (divisionIds.length === 0) {
        divisionIds = [-1];
      }
    } else if (user.role === Role.USER) {
      departmentId = user.departmentId || -1;
    } else {
      if (departmentIdQuery) departmentId = parseInt(departmentIdQuery, 10);
      if (divisionIdQuery) divisionId = parseInt(divisionIdQuery, 10);
    }

    const result = await this.getAllFolderUseCase.execute({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      shelfId,
      lockerId,
      warehouseId,
      search,
      departmentId,
      divisionId,
      divisionIds,
    });
    return {
      message: 'Success',
      ...result,
    };
  }

  // ─── GET DROPDOWN ────────────────────────────────────────────────────────────
  @Get('dropdown')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async getDropdown(
    @Req() req: any,
    @Query('shelfId') shelfId?: string,
    @Query('lockerId') lockerId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('departmentId') departmentIdQuery?: string,
    @Query('divisionId') divisionIdQuery?: string,
    @Query('search') search?: string,
  ) {
    const user = req.user;
    let departmentId: number | undefined;
    let divisionId: number | undefined;
    let divisionIds: number[] | undefined;

    if (user.role === Role.BRANCH_ADMIN) {
      const userDivs = await this.prisma.userDivisionModel.findMany({
        where: { userId: user.userId },
        select: { divisionId: true },
      });
      divisionIds = userDivs.map((ud) => ud.divisionId);
      if (divisionIds.length === 0 && user.divisionId) {
        divisionIds = [user.divisionId];
      }
      if (divisionIds.length === 0) {
        divisionIds = [-1];
      }
    } else if (user.role === Role.USER) {
      departmentId = user.departmentId || -1;
    } else {
      if (departmentIdQuery) departmentId = parseInt(departmentIdQuery, 10);
      if (divisionIdQuery) divisionId = parseInt(divisionIdQuery, 10);
    }

    const data = await this.getFolderDropdownUseCase.execute({
      shelfId,
      lockerId,
      warehouseId,
      departmentId,
      divisionId,
      divisionIds,
      search,
    });
    return { message: 'Success', data };
  }

  // ─── GET BY ID ────────────────────────────────────────────────────────────
  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async findById(@Param('id') id: string) {
    const folder = await this.getFolderByIdUseCase.execute(id);
    return { message: 'Success', data: folder };
  }

  // ─── UPDATE — HQ & BRANCH ────────────────────────────────────────────────────
  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFolderDto,
    @Req() req: any,
  ) {
    const folder = await this.updateFolderUseCase.execute(id, dto, req.user);
    return { message: 'ແກ້ໄຂໂກໂນສຳເລັດ', data: folder };
  }

  // ─── DELETE — HQ ເທົ່ານັ້ນ ─────────────────────────────────────────────────
  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN)
  async delete(@Param('id') id: string, @Req() req: any) {
    await this.deleteFolderUseCase.execute(id, req.user);
    return { message: 'ລຶບໂກໂນສຳເລັດ' };
  }
}
