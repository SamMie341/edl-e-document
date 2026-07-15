import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as userRepositoryInterface from '../../domain/repositories/user.repository.interface';
import { ApproveUserDto } from '../dtos/approve-user.dto';
import { Role } from 'src/core/auth/constants/role.enum';

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

    if (dto.role === Role.USER && dto.divisionIds && dto.divisionIds.length > 1) {
      throw new BadRequestException('ຜູ້ໃຊ້ງານທົ່ວໄປ (USER) ບໍ່ສາມາດຮັບຜິດຊອບຫຼາຍກວ່າ 1 ສາຂາໄດ້');
    }

    const updateData: any = {
      status: 'A',
      role: dto.role,
    };


    if (dto.divisionIds !== undefined) {
      updateData.divisionIds = dto.divisionIds;
    }

    const updatedUser = await this.userRepository.update(userId, updateData);

    return {
      message: 'ອະນຸມັດຜູ້ໃຊ້ສຳເລັດ',
      data: updatedUser.getPublicProfile(),
    };
  }
}
