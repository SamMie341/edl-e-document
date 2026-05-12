import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/core/auth/guards/jwt-auth.guard";
import { CreateShelfUseCase } from "../../application/use-cases/create-shelf.use-case";
import { GetShelvesByLockerUseCase } from "../../application/use-cases/get-shelves-by-locker.use-case";
import { CreateShelfDto } from "../../application/dtos/create-shelf.dto";
import { RolesGuard } from "src/core/auth/guards/roles.guard";
import { Roles } from "src/core/auth/decorators/roles.decorator";
import { Role } from "src/core/auth/constants/role.enum";
import { GetAllShelvesUseCase } from "../../application/use-cases/get-all-shelves.use-case";

@Controller('shelves')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShelfController {
    constructor(
        private readonly createShelfUseCase: CreateShelfUseCase,
        private readonly getAllShelvesUseCase: GetAllShelvesUseCase,
        private readonly getShelvesByLockerUseCase: GetShelvesByLockerUseCase,
    ) { }

    @Post()
    @Roles(Role.HQ_ADMIN, Role.BRANCH_ADMIN)
    async create(@Body() dto: CreateShelfDto) {
        const shelf = await this.createShelfUseCase.execute(dto);
        return { message: 'ເພີ່ມຊັ້ນວາງສຳເລັດ', data: shelf };
    }

    @Get()
    async findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10'
    ) {
        const pageNumber = parseInt(page, 10) || 1;
        const limitNumber = parseInt(limit, 10) || 10;

        const result = await this.getAllShelvesUseCase.execute(pageNumber, limitNumber);
        return {
            message: 'Success', ...result
        };
    }

    @Get('locker/:lockerId')
    @Roles(Role.HQ_ADMIN, Role.BRANCH_ADMIN)
    async getByLocker(@Param('lockerId') lockerId: string) {
        const shelves = await this.getShelvesByLockerUseCase.execute(lockerId);
        return { message: 'Success', data: shelves };
    }
}