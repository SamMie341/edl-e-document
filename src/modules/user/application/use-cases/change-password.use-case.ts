import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import * as userRepositoryInterface from '../../domain/repositories/user.repository.interface';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import * as bcrypt from 'bcrypt';
import { AuditService } from 'src/modules/audit/application/services/audit.service';
import { AuditAction } from 'src/core/constants/audit-action.enum';
import { AppException } from 'src/core/exceptions/app.exception';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(userRepositoryInterface.USER_REPOSITORY)
    private readonly userRepository: userRepositoryInterface.IUserRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user)
      throw new AppException(
        'NOT_FOUND',
        'ບໍ່ພົບຜູ້ໃຊ້ງານ!',
        { userId },
        HttpStatus.NOT_FOUND,
      );

    const isOldPasswordValid = await bcrypt.compare(
      dto.oldPassword,
      user.password,
    );
    if (!isOldPasswordValid) {
      throw new AppException(
        'BAD_REQUEST',
        'ລະຫັດຜ່ານເກົ່າບໍ່ຖືກຕ້ອງ!',
        '',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isSameAsOld = await bcrypt.compare(dto.newPassword, user.password);
    if (isSameAsOld) {
      throw new AppException(
        'BAD_REQUEST',
        'ລະຫັດຜ່ານໃໝ່ຕ້ອງບໍ່ຊ້ຳກັບລະຫັດຜ່ານເກົ່າ!',
        '',
        HttpStatus.BAD_REQUEST,
      );
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(dto.newPassword, salt);

    user.updatePassword(newHash);
    await this.userRepository.save(user);

    await this.auditService.log({
      action: AuditAction.PASSWORD_CHANGED,
      details: 'ຜູ້ໃຊ້ປ່ຽນລະຫັດຜ່ານດ້ວຍຕົວເອງ',
      entityId: user.id,
      entityType: 'USER',
      actorId: user.id,
      departmentId: user.departmentId,
    });
  }
}
