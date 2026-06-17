import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as userRepositoryInterface from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { Role } from 'src/core/auth/constants/role.enum';

@Injectable()
export class UpdateUserDivisionsUseCase {
  constructor(
    @Inject(userRepositoryInterface.USER_REPOSITORY)
    private readonly userRepository: userRepositoryInterface.IUserRepository,
  ) { }

  async execute(userId: string, divisionIds: number[]): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('ບໍ່ພົບຂໍ້ມູນຜູ້ໃຊ້ງານ');
    }

    if (user.role === Role.USER && divisionIds.length > 1) {
      throw new BadRequestException('ຜູ້ໃຊ້ງານທົ່ວໄປ (USER) ບໍ່ສາມາດຮັບຜິດຊອບຫຼາຍກວ່າ 1 ສາຂາໄດ້');
    }

    const updatedUser = await this.userRepository.update(userId, { divisionIds });
    return updatedUser;
  }
}
