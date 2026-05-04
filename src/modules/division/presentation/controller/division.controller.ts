import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/core/auth/guards/jwt-auth.guard";
import { SyncDivisionUseCase } from "../../application/use-cases/sync-divisions.use-case";
import { Roles } from "src/core/auth/decorators/roles.decorator";
import { Role } from "src/core/auth/constants/role.enum";
import { GetDivisionsUseCase } from "../../application/use-cases/get-division.use-case";

@Controller('divisions')
@UseGuards(JwtAuthGuard)
export class DivisionController {
    constructor(
        private readonly syncDivisionUseCase: SyncDivisionUseCase,
        private readonly getDivisionUseCase: GetDivisionsUseCase,
    ) { }

    @Post('sync')
    @Roles(Role.SUPER_ADMIN)
    async sync() {
        return await this.syncDivisionUseCase.execute();
    }

    @Get()
    async getAllDivisions() {
        const data = await this.getDivisionUseCase.execute();
        return {
            message: 'Success',
            data: data,
        }
    }
}