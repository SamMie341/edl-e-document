import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/core/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/auth/guards/roles.guard';
import { GetBranchesUseCase } from '../../application/use-cases/get-branches.use-case';
import { Roles } from 'src/core/auth/decorators/roles.decorator';
import { Role } from 'src/core/auth/constants/role.enum';
import { CreateBranchDto } from '../../application/dtos/create-branch.dto';

@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchController {
  constructor(private readonly getBranchesUseCase: GetBranchesUseCase) {}

  @Get()
  async getAllBranches() {
    const branches = await this.getBranchesUseCase.execute();
    return { data: branches };
  }
}
