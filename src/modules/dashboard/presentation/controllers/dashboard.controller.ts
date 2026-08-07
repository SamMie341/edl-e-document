import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/core/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/auth/guards/roles.guard';
import { Roles } from 'src/core/auth/decorators/roles.decorator';
import { Role } from 'src/core/auth/constants/role.enum';
import { GetDashboardStatsUseCase } from '../../application/use-cases/get-dashboard-stats.use-case';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(
    private readonly getDashboardStatsUseCase: GetDashboardStatsUseCase,
  ) {}

  /**
   * GET /dashboard/stats
   * ດຶງຂໍ້ມູນສະຖິຕິ Dashboard:
   * - ຈຳນວນ Warehouse, Locker, Shelf, Folder, DocumentType, Document, BorrowDocument
   * - ຈຳນວນເອກະສານຕາມแต่ละ Department
   */
  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
  async getStats(
    @Req() req: any,
    @Query('departmentId') departmentIdQuery?: string,
  ) {
    const user = req.user;
    let departmentId: number | undefined;

    if (departmentIdQuery) {
      const parsed = parseInt(departmentIdQuery, 10);
      if (isNaN(parsed)) {
        throw new BadRequestException('departmentId ຕ້ອງເປັນຕົວເລກ (Number)');
      }
      departmentId = parsed;
    } else if (user.role === Role.BRANCH_ADMIN && user.departmentId) {
      departmentId = user.departmentId;
    }

    const data = await this.getDashboardStatsUseCase.execute({ departmentId });

    return {
      message: 'Success',
      data,
    };
  }
}
