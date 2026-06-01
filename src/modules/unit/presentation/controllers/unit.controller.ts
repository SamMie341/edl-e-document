import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SyncUnitUseCase } from '../../application/use-cases/sync-units.use-case';
import { JwtAuthGuard } from 'src/core/auth/guards/jwt-auth.guard';
import { Roles } from 'src/core/auth/decorators/roles.decorator';
import { Role } from 'src/core/auth/constants/role.enum';
import { GetUnitsUseCase } from '../../application/use-cases/get-units.use-case';

@Controller('units')
@UseGuards(JwtAuthGuard)
export class UnitController {
  constructor(
    private readonly syncUnitsUseCase: SyncUnitUseCase,
    private readonly getAllUnitsUseCase: GetUnitsUseCase,
  ) {}

  @Post('sync')
  @Roles(Role.SUPER_ADMIN)
  async syncUnits() {
    const result = await this.syncUnitsUseCase.execute();
    return {
      message: 'Sync ຂໍ້ມູນໜ່ວຍງານສຳເລັດ',
      data: result,
    };
  }

  @Get()
  async getAllUnits() {
    const data = await this.getAllUnitsUseCase.execute();
    return {
      message: 'Success',
      data: data,
    };
  }
}
