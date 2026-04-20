import { Body, Controller, Param, Put, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/core/auth/guards/roles.guard";
import { ChangePasswordUseCase } from "../../application/use-cases/change-password.use-case";
import { ResetPasswordUseCase } from "../../application/use-cases/reset-password.use-case";
import { Roles } from "src/core/auth/decorators/roles.decorator";
import { Role } from "src/core/auth/constants/role.enum";
import { ChangePasswordDto } from "../../application/dtos/change-password.dto";
import { ResetPasswordDto } from "../../application/dtos/reset-password";

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
    constructor(
        private readonly changePasswordUseCase: ChangePasswordUseCase,
        private readonly resetPasswordUseCase: ResetPasswordUseCase,
    ) { }

    @Put('change-password')
    @Roles(Role.USER, Role.SUPER_ADMIN, Role.HQ_ADMIN, Role.BRANCH_ADMIN)
    async changePassword(@Body() dto: ChangePasswordDto, @Req() req: any) {
        await this.changePasswordUseCase.execute(req.user.userId, dto);
        return { message: 'ປ່ຽນລະຫັດຜ່ານສຳເລັດ' };
    }

    @Put(':id/reset-password')
    @Roles(Role.BRANCH_ADMIN, Role.HQ_ADMIN, Role.SUPER_ADMIN)
    async resetPassword(
        @Param('id') targetUserId: string,
        @Body() dto: ResetPasswordDto,
        @Req() req: any
    ) {
        await this.resetPasswordUseCase.execute(targetUserId, dto, req.user);
        return { message: 'ຣີເຊັດລະຫັດຜ່ານສຳເລັດ' };
    }
}