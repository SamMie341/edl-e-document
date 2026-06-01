import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as userRepositoryInterface from '../../domain/repositories/user.repository.interface';

@Injectable()
export class UpdateUserRoleUseCase {
  constructor(
    @Inject(userRepositoryInterface.USER_REPOSITORY)
    private readonly userRepository: userRepositoryInterface.IUserRepository,
  ) {}

  async execute(targetUserId: string, newRole: string): Promise<void> {
    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) throw new NotFoundException('ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ງານ');

    targetUser.updateRole(newRole);
    await this.userRepository.save(targetUser);
  }
}
