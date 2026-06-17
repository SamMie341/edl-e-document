import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as userRepositoryInterface from '../../domain/repositories/user.repository.interface';
import { Role } from 'src/core/auth/constants/role.enum';

@Injectable()
export class UpdateUserRoleUseCase {
  constructor(
    @Inject(userRepositoryInterface.USER_REPOSITORY)
    private readonly userRepository: userRepositoryInterface.IUserRepository,
  ) { }

  async execute(targetUserId: string, newRole: string): Promise<void> {
    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) throw new NotFoundException('ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ງານ');

    if (newRole === Role.USER && targetUser.divisions && targetUser.divisions.length > 1) {
      throw new BadRequestException('ບໍ່ສາມາດປ່ຽນສິດເປັນ USER ໄດ້ ເນື່ອງຈາກຜູ້ໃຊ້ນີ້ຮັບຜິດຊອບຫຼາຍສາຂາ');
    }

    targetUser.updateRole(newRole);
    await this.userRepository.save(targetUser);
  }
}
