import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as userRepositoryInterface from '../../domain/repositories/user.repository.interface';
import { ResetPasswordDto } from '../dtos/reset-password';
import { Role } from 'src/core/auth/constants/role.enum';
import * as bcrypt from 'bcrypt';
import { AuditService } from 'src/modules/audit/application/services/audit.service';
import { AuditAction } from 'src/core/constants/audit-action.enum';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(userRepositoryInterface.USER_REPOSITORY)
    private readonly userRepository: userRepositoryInterface.IUserRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(targetUserId: string, adminUser: any): Promise<void> {
    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) throw new NotFoundException('ບໍ່ພົບບັນຊີຜູ້ໃຊ້');

    if (adminUser.role === Role.BRANCH_ADMIN) {
      if (adminUser.departmentId !== targetUser.departmentId) {
        throw new ForbiddenException(
          'ທ່ານບໍ່ມີສິດຣີເຊັດລະຫັດຜ່ານພະນັກງານພະແນກອື່ນ...',
        );
      }
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash('EDL1234', salt);

    targetUser.updatePassword(newHash);
    await this.userRepository.save(targetUser);

    await this.auditService.log({
      action: AuditAction.PASSWORD_RESEST,
      details: `ຣີເຊັດລະຫັດຜ່ານບັນຊີ: ${targetUser.firstNameLa || ''} ${targetUser.lastNameLa || ''} (EmpCode: ${targetUser.empCode || ''})`,
      entityId: targetUser.id,
      entityType: 'USER',
      actorId: adminUser?.userId || adminUser?.id,
      departmentId: adminUser?.departmentId || targetUser.departmentId,
    });
  }
}
