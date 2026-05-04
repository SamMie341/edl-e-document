import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/core/auth/guards/roles.guard";
import { CreateFolderUseCase } from "../../application/use-cases/create-folder.use-case";
import { Roles } from "src/core/auth/decorators/roles.decorator";
import { Role } from "src/core/auth/constants/role.enum";
import { CreateFolderDto } from "../../application/dtos/create-folder.use-case";

@Controller('folders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FolderController {
    constructor(
        private readonly createFolderUseCase: CreateFolderUseCase,
    ) { }

    @Post()
    @Roles(Role.BRANCH_ADMIN, Role.HQ_ADMIN, Role.SUPER_ADMIN)
    async createFolder(@Body() dto: CreateFolderDto) {
        const foler = await this.createFolderUseCase.execute(dto);
        return {
            message: 'ສ້າງໂກໂນສຳເລັດ',
            data: foler,
        };
    }

}