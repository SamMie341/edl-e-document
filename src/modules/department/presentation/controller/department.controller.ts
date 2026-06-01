import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/core/auth/guards/jwt-auth.guard';
import { GetDepartmentsUseCase } from '../../application/use-cases/get-department.use-case';
import { Roles } from 'src/core/auth/decorators/roles.decorator';
import { Role } from 'src/core/auth/constants/role.enum';
import { SyncDepartmentUseCase } from '../../application/use-cases/sync-department.use-case';

@Controller('departments')
@UseGuards(JwtAuthGuard)
export class DepartmentController {
  constructor(
    private readonly getDepartmentsUseCase: GetDepartmentsUseCase,
    private readonly syncDepartmentUseCase: SyncDepartmentUseCase,
  ) {}

  @Get()
  async getAllDepartments() {
    const data = await this.getDepartmentsUseCase.execute();
    return {
      message: 'Success',
      data: data,
    };
  }

  @Post('sync')
  @Roles(Role.SUPER_ADMIN)
  async sync() {
    return await this.syncDepartmentUseCase.execute();
  }
}
