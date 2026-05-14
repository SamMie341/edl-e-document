import { Body, Controller, Get, Param, Patch, Put, Query, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/core/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/core/auth/guards/roles.guard";
import { ChangePasswordUseCase } from "../../application/use-cases/change-password.use-case";
import { ResetPasswordUseCase } from "../../application/use-cases/reset-password.use-case";
import { Roles } from "src/core/auth/decorators/roles.decorator";
import { Role } from "src/core/auth/constants/role.enum";
import { ChangePasswordDto } from "../../application/dtos/change-password.dto";
import { GetProfileUseCase } from "../../application/use-cases/get-profile.use-case";
import { GetAllUsersUseCase } from "../../application/use-cases/get-all-users.use-case";
import { UpdateUserRoleUseCase } from "../../application/use-cases/update-user-role.use-case";
import { UpdateRoleDto } from "../../application/dtos/update-role.dto";
import { ApproveUserUseCase } from "../../application/use-cases/approve-user.use-case";
import { ApproveUserDto } from "../../application/dtos/approve-user.dto";

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
    constructor(
        private readonly changePasswordUseCase: ChangePasswordUseCase,
        private readonly resetPasswordUseCase: ResetPasswordUseCase,
        private readonly getProfileUseCase: GetProfileUseCase,
        private readonly getAllUsersUseCase: GetAllUsersUseCase,
        private readonly updateUserRoleUseCase: UpdateUserRoleUseCase,
        private readonly approveUserUseCase: ApproveUserUseCase,
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
        @Req() req: any
    ) {
        await this.resetPasswordUseCase.execute(targetUserId, req.user);
        return { message: 'ຣີເຊັດລະຫັດຜ່ານສຳເລັດ' };
    }

    @Get('profile')
    async getProfile(@Req() req: any) {
        const userId = req.user.userId || req.user.sub;
        const profile = await this.getProfileUseCase.execute(userId);
        return {
            message: 'Success',
            data: profile
        }
    }

    @Get()
    @Roles(Role.SUPER_ADMIN)
    async getAllUsers(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10'
    ) {
        const pageNumber = parseInt(page, 10) || 1;
        const limitNumber = parseInt(limit, 10) || 10;
        const result = await this.getAllUsersUseCase.execute(pageNumber, limitNumber);
        return { message: 'Success', ...result };
    }

    @Put(':id/role')
    @Roles(Role.SUPER_ADMIN)
    async updateRole(
        @Param('id') targetUserId: string,
        @Body() dto: UpdateRoleDto,
    ) {
        await this.updateUserRoleUseCase.execute(targetUserId, dto.role);
        return { message: 'ປ່ຽນສິດຜູ້ໃຊ້ສຳເລັດ' };
    }

    @Patch(':id/approve')
    @Roles(Role.SUPER_ADMIN)
    async approveUser(
        @Param('id') id: string,
        @Body() dto: ApproveUserDto,
    ) {
        return await this.approveUserUseCase.execute(id, dto);
    }

}