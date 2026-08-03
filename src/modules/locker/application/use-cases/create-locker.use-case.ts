import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as lockerRepositoryInterface from '../../domain/repositories/locker.repository.interface';
import { CreateLockerDto } from '../dtos/create-locker.dto';
import { Role } from 'src/core/auth/constants/role.enum';
import { PrismaService } from 'src/core/database/prisma.service';
import { AuditService } from 'src/modules/audit/application/services/audit.service';
import { AuditAction } from 'src/core/constants/audit-action.enum';

@Injectable()
export class CreateLockerUseCase {
  constructor(
    @Inject(lockerRepositoryInterface.LOCKER_REPOSITORY)
    private readonly lockerRepository: lockerRepositoryInterface.ILockerRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) { }

  async execute(dto: CreateLockerDto, user: any) {
    if (dto.warehouseId) {
      // 1. Verify target warehouse exists
      const warehouse = await this.prisma.warehouseModel.findUnique({
        where: { id: dto.warehouseId },
      });
      if (!warehouse) {
        throw new NotFoundException('ບໍ່ພົບສາງນີ້ໃນລະບົບ');
      }

      // 2. If user is BRANCH_ADMIN, verify warehouse belongs to their branch
      if (user.role === Role.BRANCH_ADMIN) {
        if (warehouse.departmentId !== user.departmentId) {
          throw new ForbiddenException(
            'ທ່ານບໍ່ມີສິດສ້າງຕູ້ Locker ໃນສາງຂອງພະແນກອື່ນ',
          );
        }
      }
    } else {
      // For BRANCH_ADMIN, warehouseId is required to verify ownership
      if (user.role === Role.BRANCH_ADMIN) {
        throw new ForbiddenException('ກະລຸນາລະບຸສາງເອກະສານສຳລັບຕູ້ Locker');
      }
    }

    const created = await this.lockerRepository.create(dto);

    await this.auditService.log({
      action: AuditAction.CREATED,
      details: `ສ້າງຕູ້ Locker: ${created.code} ${created.name || ''}`,
      entityId: created.id,
      entityType: 'LOCKER',
      actorId: user?.userId || user?.id,
      departmentId: user?.departmentId,
      divisionId: user?.divisionId,
    });

    return created;
  }
}
