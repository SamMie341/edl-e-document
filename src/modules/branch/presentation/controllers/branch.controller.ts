import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/core/auth/guards/roles.guard";
import { CreateBranchUseCase } from "../../application/use-cases/create-branch.use-case";
import { GetBranchesUseCase } from "../../application/use-cases/get-branches.use-case";
import { Roles } from "src/core/auth/decorators/roles.decorator";
import { Role } from "src/core/auth/constants/role.enum";
import { CreateBranchDto } from "../../application/dtos/create-branch.dto";

@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchController {
    constructor(
        private readonly createBranchUseCase: CreateBranchUseCase,
        private readonly getBranchesUseCase: GetBranchesUseCase
    ) { }

    // @Post()
    // @Roles(Role.SUPER_ADMIN)
    // async createBranch(@Body() dto: CreateBranchDto, @Req() req: any) {
    //     const branch = await this.createBranchUseCase.execute(dto, req.user.role);
    //     return {
    //         message: 'ເພີ່ມສາຂາສຳເລັດ...',
    //         data: branch,
    //     };
    // }

    @Get()
    @Roles(Role.BRANCH_ADMIN, Role.HQ_ADMIN, Role.SUPER_ADMIN, Role.USER)
    async getAllBranches() {
        const branches = await this.getBranchesUseCase.execute();
        return { data: branches };
    }
}