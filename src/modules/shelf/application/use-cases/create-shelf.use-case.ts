import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as shelfRepositoriesInterface from '../../domain/repositories/shelf.repositories.interface';
import { CreateShelvesDto } from '../dtos/create-shelf.dto';
import { Role } from 'src/core/auth/constants/role.enum';
import { PrismaService } from 'src/core/database/prisma.service';
import { AuditService } from 'src/modules/audit/application/services/audit.service';
import { AuditAction } from 'src/core/constants/audit-action.enum';

@Injectable()
export class CreateShelfUseCase {
  constructor(
    @Inject(shelfRepositoriesInterface.SHELF_REPOSITORY)
    private readonly shelfRepository: shelfRepositoriesInterface.IShelfRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) { }

  async execute(dto: CreateShelvesDto, user: any) {
    if (!dto.shelves || dto.shelves.length === 0) {
      throw new BadRequestException('ລາຍການຊັ້ນວາງຫ້າມເປັນຄ່າວ່າງ');
    }

    const itemsToCreate: Array<{
      name?: string;
      description?: string;
      maxQty: number;
      lockerId: string;
    }> = [];

    for (const shelfDto of dto.shelves) {
      const lockerId = dto.lockerId;
      if (!lockerId) {
        throw new BadRequestException('ກະລຸນາລະບຸ ID ຕູ້ Locker');
      }

      const locker = await this.prisma.lockerModel.findUnique({
        where: { id: lockerId },
        include: { warehouse: true },
      });
      if (!locker) {
        throw new NotFoundException(`ບໍ່ພົບຕູ້ Locker ID '${lockerId}' ນີ້ໃນລະບົບ`);
      }

      if (user.role === Role.BRANCH_ADMIN) {
        if (locker.warehouse?.departmentId !== user.departmentId) {
          throw new ForbiddenException(
            `ທ່ານບໍ່ມີສິດສ້າງຊັ້ນວາງໃນຕູ້ Locker '${locker.name || locker.code}' ຂອງສາຂາອື່ນ`,
          );
        }
      }

      itemsToCreate.push({
        name: shelfDto.name,
        description: shelfDto.description,
        maxQty: shelfDto.maxQty,
        lockerId,
      });
    }

    const createdShelves = await this.shelfRepository.createMany(itemsToCreate);

    for (const shelf of createdShelves) {
      await this.auditService.log({
        action: AuditAction.CREATED,
        details: `ສ້າງຊັ້ນວາງ: ${shelf.name}`,
        entityId: shelf.id,
        entityType: 'SHELF',
        actorId: user?.userId || user?.id,
        departmentId: user?.departmentId,
        divisionId: user?.divisionId,
      });
    }

    return createdShelves;
  }
}
