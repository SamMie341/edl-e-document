import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/core/auth/guards/jwt-auth.guard";
import { CreateLockerUseCase } from "../../application/use-cases/create-locker.use-case";
import { GetAllLockersUseCase } from "../../application/use-cases/get-all-lockers.use-case";
import { CreateLockerDto } from "../../application/dtos/create-locker.dto";
import { Roles } from "src/core/auth/decorators/roles.decorator";
import { Role } from "src/core/auth/constants/role.enum";
import { RolesGuard } from "src/core/auth/guards/roles.guard";

@Controller('lockers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LockerController {
    constructor(
        private readonly createLockerUseCase: CreateLockerUseCase,
        private readonly getAllLockerUseCase: GetAllLockersUseCase,
    ) { }

    @Post()
    @Roles(Role.HQ_ADMIN, Role.BRANCH_ADMIN)
    async create(@Body() dto: CreateLockerDto) {
        const locker = await this.createLockerUseCase.execute(dto);
        return { message: 'ເພີ່ມຕູ້ Locker ສຳເລັດ', data: locker };
    }

    @Get()
    @Roles(Role.HQ_ADMIN, Role.BRANCH_ADMIN)
    async findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
    ) {
        const pageNumber = parseInt(page, 10) || 1;
        const limitNumber = parseInt(limit, 10) || 10;

        const result = await this.getAllLockerUseCase.execute(pageNumber, limitNumber);
        return { message: 'Success', ...result };
    }
}