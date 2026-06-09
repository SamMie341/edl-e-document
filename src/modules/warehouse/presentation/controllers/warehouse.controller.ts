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
import { Roles } from 'src/core/auth/decorators/roles.decorator';
import { Role } from 'src/core/auth/constants/role.enum';
import { CreateWarehouseDto } from '../../application/dtos/create-warehouse.dto';
import { UpdateWarehouseDto } from '../../application/dtos/update-warehouse.dto';

@Controller('warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehouseController {
  constructor(
    private readonly createWarehouseUseCase: CreateWarehouseUseCase,
    private readonly getAllWarehouseUseCase: GetAllWarehouseUseCase,
    private readonly updateWarehouseUseCase: UpdateWarehouseUseCase,
    private readonly deleteWarehouseUseCase: DeleteWarehouseUseCase,
  ) { }

  // ─── GET ALL ─────────────────────────────────────────────────────────────────
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const result = await this.getAllWarehouseUseCase.execute({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      search,
      status,
    });
    return { message: 'Success', ...result };
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
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.deleteWarehouseUseCase.execute(id);
    return { message: 'ລົບສາງສຳເລັດ' };
  }
}
