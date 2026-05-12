import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/core/auth/guards/roles.guard";
import { CreateFolderUseCase } from "../../application/use-cases/create-folder.use-case";
import { Roles } from "src/core/auth/decorators/roles.decorator";
import { Role } from "src/core/auth/constants/role.enum";
import { CreateFolderDto } from "../../application/dtos/create-folder.dto";
import { GetFoldersByShelfUseCase } from "../../application/use-cases/get-folders-by-shelf.use-case";
import { GetAllFolderUseCase } from "../../application/use-cases/get-all-folders.use-case";

@Controller('folders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FolderController {
    constructor(
        private readonly createFolderUseCase: CreateFolderUseCase,
        private readonly getAllFolderUseCase: GetAllFolderUseCase,
        private readonly getFoldersByShelfUseCase: GetFoldersByShelfUseCase,
    ) { }

    @Post()
    @Roles(Role.BRANCH_ADMIN, Role.HQ_ADMIN, Role.USER)
    async create(@Body() dto: CreateFolderDto) {
        const foler = await this.createFolderUseCase.execute(dto);
        return {
            message: 'ສ້າງໂກໂນສຳເລັດ',
            data: foler,
        };
    }

    @Get()
    async findAll(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
    ) {
        const pageNumber = parseInt(page, 10) || 1;
        const limitNumber = parseInt(limit, 10) || 10;
        const result = await this.getAllFolderUseCase.execute(pageNumber, limitNumber);
        return {
            message: 'Success',
            ...result,
        };
    }

    @Get('shelf/:shelfId')
    async getShelf(@Param('shelfId') shelfId: string) {
        const folders = await this.getFoldersByShelfUseCase.execute(shelfId);
        return {
            message: 'Success',
            data: folders,
        };
    }

}