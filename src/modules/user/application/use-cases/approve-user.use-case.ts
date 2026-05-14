import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import * as userRepositoryInterface from "../../domain/repositories/user.repository.interface";
import { ApproveUserDto } from "../dtos/approve-user.dto";

@Injectable()
export class ApproveUserUseCase {
    constructor(
        @Inject(userRepositoryInterface.USER_REPOSITORY)
        private readonly userRepository: userRepositoryInterface.IUserRepository,
    ) { }

    async execute(userId: string, dto: ApproveUserDto) {
        const user = await this.userRepository.findById(userId);
        if (!user) throw new NotFoundException('ບໍ່ພົບຜູ້ໃຊ້ໃນລະບົບ');

        if (user.status === 'A') {
            throw new BadRequestException('ອີເມວນີ້ຖືກອະນຸມັດແລ້ວ');
        }

        const updatedUser = await this.userRepository.update(userId, {
            status: 'A',
            role: dto.role,
        });

        return {
            message: 'ອະນຸມັດຜູ້ໃຊ້ສຳເລັດ',
            data: updatedUser.getPublicProfile(),
        }
    }
}