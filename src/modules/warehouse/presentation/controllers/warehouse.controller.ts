import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/core/auth/guards/roles.guard";
import { CreateWarehouseUseCase } from "../../application/use-cases/create-warehouse.use-case";
import { GetWarehousesByBranchUseCase } from "../../application/use-cases/get-warehouse-by-branch.use-case";
import { Roles } from "src/core/auth/decorators/roles.decorator";
import { Role } from "src/core/auth/constants/role.enum";
import { CreateWarehouseDto } from "../../application/dtos/create-warehouse.dto";
import { GetAllWarehouseUseCase } from "../../application/use-cases/get-all-warehouse.use-case";
import { PrismaService } from "src/core/database/prisma.service";

@Controller('warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WarehouseController {
    constructor(
        private readonly createWarehouseUseCase: CreateWarehouseUseCase,
        private readonly getAllWarehouseUseCase: GetAllWarehouseUseCase,
        private readonly getWarehouseByBranchUseCase: GetWarehousesByBranchUseCase,
        private readonly prisma: PrismaService,
    ) { }

    @Get('branches/dropdown')
    async gerBranchDropdown(@Req() req: any) {
        const user = req.user;

        console.log(user);

        let condition = {};

        if (user.role !== Role.SUPER_ADMIN && user.role !== Role.HQ_ADMIN) {
            if (user.branchId) {
                condition = { id: Number(user.branchId) };
            } else {
                condition = { id: -1 };
            }
        }

        const branches = await this.prisma.branchModel.findMany({
            where: condition,
            select: { id: true, name: true, divisions: true, addresses: true },
            orderBy: { name: 'asc' },
        });
        return { message: 'Success', data: branches };
    }

    @Post()
    @Roles(Role.HQ_ADMIN, Role.BRANCH_ADMIN)
    async create(@Body() dto: CreateWarehouseDto, @Req() req: any) {
        const warehouse = await this.createWarehouseUseCase.execute(dto, req.user);
        return {
            message: 'ເພີ່ມສາງສຳເລັດ', data: warehouse,
        }
    }

    @Get()
    async findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
    ) {
        const pageNumber = parseInt(page, 10) || 1;
        const limitNumber = parseInt(limit, 10) || 10;

        const result = await this.getAllWarehouseUseCase.execute(pageNumber, limitNumber);

        return {
            message: 'Success',
            ...result,
        }
    }

    @Get('branch/:branchId')
    async getByBranch(@Param('branchId') branchId: number) {
        const warehouses = await this.getWarehouseByBranchUseCase.execute(branchId);
        return {
            message: 'Success',
            data: warehouses,
        }
    }
}