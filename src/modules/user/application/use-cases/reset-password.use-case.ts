import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import * as userRepositoryInterface from "../../domain/repositories/user.repository.interface";
import { ResetPasswordDto } from "../dtos/reset-password";
import { Role } from "src/core/auth/constants/role.enum";
import * as bcrypt from "bcrypt";

@Injectable()
export class ResetPasswordUseCase {
    constructor(
        @Inject(userRepositoryInterface.USER_REPOSITORY)
        private readonly userRepository: userRepositoryInterface.IUserRepository,
    ) { }

    async execute(targetUserId: string, dto: ResetPasswordDto, adminUser: any): Promise<void> {
        const targetUser = await this.userRepository.findById(targetUserId);
        if (!targetUser) throw new NotFoundException('ບໍ່ພົບບັນຊີຜູ້ໃຊ້');

        if (adminUser.role === Role.BRANCH_ADMIN) {
            if (targetUser.branchId !== adminUser.branchId) {
                throw new ForbiddenException('ທ່ານບໍ່ມີສິດຣີເຊັດລະຫັດຜ່ານພະນັກງານສາຂາອື່ນ...');
            }
        }

        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(dto.newPassword, salt);

        targetUser.updatePassword(newHash);
        await this.userRepository.save(targetUser);
    }
}