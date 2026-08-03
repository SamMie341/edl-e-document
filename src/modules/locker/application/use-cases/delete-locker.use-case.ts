import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import * as lockerRepositoryInterface from '../../domain/repositories/locker.repository.interface';
import { Role } from 'src/core/auth/constants/role.enum';
import { AuditService } from 'src/modules/audit/application/services/audit.service';
import { AuditAction } from 'src/core/constants/audit-action.enum';

@Injectable()
export class DeleteLockerUseCase {
  constructor(
    @Inject(lockerRepositoryInterface.LOCKER_REPOSITORY)
    private readonly lockerRepository: lockerRepositoryInterface.ILockerRepository,
    private readonly auditService: AuditService,
  ) { }

  async execute(id: string, user: any): Promise<void> {
    if (user.role === Role.USER) {
      throw new ForbiddenException('ທ່ານບໍ່ມີສິດລົບຕູ້ Locker ໄດ້');
    }
    await this.lockerRepository.delete(id);
    await this.auditService.log({
      action: AuditAction.DELETED,
      details: `ລຶບຕູ້ Locker ID: ${id}`,
      entityId: id,
      entityType: 'LOCKER',
      actorId: user?.userId || user?.id,
      departmentId: user?.departmentId,
      divisionId: user?.divisionId,
    });
  }
}
