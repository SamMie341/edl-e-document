import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/core/auth/guards/roles.guard";
import { CreateFolderUseCase } from "../../application/use-cases/create-folder.use-case";
import { UpdateFolderUseCase } from "../../application/use-cases/update-folder.use-case";
import { DeleteFolderUseCase } from "../../application/use-cases/delete-folder.use-case";
import { Roles } from "src/core/auth/decorators/roles.decorator";
import { Role } from "src/core/auth/constants/role.enum";
import { CreateFolderDto } from "../../application/dtos/create-folder.dto";
import { UpdateFolderDto } from "../../application/dtos/update-folder.dto";
import { GetFoldersByShelfUseCase } from "../../application/use-cases/get-folders-by-shelf.use-case";
import { GetAllFolderUseCase } from "../../application/use-cases/get-all-folders.use-case";

@Controller('folders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FolderController {
    constructor(
        private readonly createFolderUseCase: CreateFolderUseCase,
        private readonly getAllFolderUseCase: GetAllFolderUseCase,
        private readonly getFoldersByShelfUseCase: GetFoldersByShelfUseCase,
        private readonly updateFolderUseCase: UpdateFolderUseCase,
        private readonly deleteFolderUseCase: DeleteFolderUseCase,
    ) { }

    @Post()
    @Roles(Role.BRANCH_ADMIN, Role.HQ_ADMIN, Role.USER)
    async create(@Body() dto: CreateFolderDto) {
        const folder = await this.createFolderUseCase.execute(dto);
        return {
            message: 'ສ້າງໂກໂນສຳເລັດ',
            data: folder,
        };
    }

    @Get()
    @Roles(Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
    async findAll(
        @Req() req: any,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('shelfId') shelfId?: string,
        @Query('search') search?: string,
    ) {
        const user = req.user;
        const isHQ = user.role === Role.HQ_ADMIN;
        const branchId = isHQ ? undefined : user.branchId;
        const divisionId = isHQ ? undefined : user.divisionId;

        const result = await this.getAllFolderUseCase.execute({
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 10,
            shelfId,
            search,
            branchId,
            divisionId,
        });
        return {
            message: 'Success',
            ...result,
        };
    }

    @Get('shelf/:shelfId')
    @Roles(Role.HQ_ADMIN, Role.BRANCH_ADMIN, Role.USER)
    async getByShelf(@Param('shelfId') shelfId: string) {
        const folders = await this.getFoldersByShelfUseCase.execute(shelfId);
        return {
            message: 'Success',
            data: folders,
        };
    }

    // ─── UPDATE — HQ & BRANCH ────────────────────────────────────────────────────
    @Put(':id')
    @Roles(Role.HQ_ADMIN, Role.BRANCH_ADMIN)
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateFolderDto,
        @Req() req: any,
    ) {
        const folder = await this.updateFolderUseCase.execute(id, dto, req.user);
        return { message: 'ແກ້ໄຂໂກໂນສຳເລັດ', data: folder };
    }

    // ─── DELETE — HQ ເທົ່ານັ້ນ ─────────────────────────────────────────────────
    @Delete(':id')
    @Roles(Role.HQ_ADMIN)
    async delete(@Param('id') id: string, @Req() req: any) {
        await this.deleteFolderUseCase.execute(id, req.user);
        return { message: 'ລຶບໂກໂນສຳເລັດ' };
    }

}