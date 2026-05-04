import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/core/auth/guards/jwt-auth.guard";
import { SyncOfficesUseCase } from "../../application/use-cases/sync-offices.use-case";
import { Roles } from "src/core/auth/decorators/roles.decorator";
import { Role } from "src/core/auth/constants/role.enum";
import { GetOfficesUseCase } from "../../application/use-cases/get-offices.use-case";

@Controller('offices')
@UseGuards(JwtAuthGuard)
export class OfficeController {
    constructor(
        private readonly syncOfficeUseCase: SyncOfficesUseCase,
        private readonly getOfficesUseCase: GetOfficesUseCase,
    ) { }

    @Post('sync')
    @Roles(Role.SUPER_ADMIN)
    async sync() {
        return await this.syncOfficeUseCase.execute();
    }

    @Get()
    async getAllOffices() {
        const data = await this.getOfficesUseCase.execute();
        return {
            message: 'Success',
            data: data,
        }
    }
}