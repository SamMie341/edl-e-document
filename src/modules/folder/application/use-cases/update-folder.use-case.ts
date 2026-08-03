import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as folderRepositoryInterface from '../../domain/repositories/folder.repository.interface';
import { UpdateFolderDto } from '../dtos/update-folder.dto';
import { Role } from 'src/core/auth/constants/role.enum';
import { PrismaService } from 'src/core/database/prisma.service';
import { AuditService } from 'src/modules/audit/application/services/audit.service';
import { AuditAction } from 'src/core/constants/audit-action.enum';

@Injectable()
export class UpdateFolderUseCase {
  constructor(
    @Inject(folderRepositoryInterface.FOLDER_REPOSITORY)
    private readonly folderRepository: folderRepositoryInterface.IFolderRepository,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) { }

  async execute(id: string, dto: UpdateFolderDto, user: any) {
    // ตรวจสอบ folder มีอยู่จริง
    const existing = await this.prisma.folderModel.findUnique({
      where: { id },
      include: {
        shelf: {
          include: {
            locker: { include: { warehouse: true } },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('ບໍ່ພົບໂກໂນນີ້ໃນລະບົບ');
    }

    // BRANCH_ADMIN: ตรวจสอบว่า folder นี้อยู่ใน department ตัวเอง
    if (user.role === Role.BRANCH_ADMIN) {
      const warehouseDept = existing.shelf?.locker?.warehouse?.departmentId;
      if (warehouseDept !== user.departmentId) {
        throw new ForbiddenException('ທ່ານບໍ່ມີສິດແກ້ໄຂໂກໂນຂອງພະແນກອື່ນ');
      }
    }

    let updated;
    // ถ้ามีการเปลี่ยน shelfId → recalculate locationRef
    if (dto.shelfId && dto.shelfId !== existing.shelfId) {
      const newShelf = await this.prisma.shelfModel.findUnique({
        where: { id: dto.shelfId },
        include: {
          locker: {
            include: {
              warehouse: {
                include: {
                  department: true,
                  division: true,
                },
              },
            },
          },
        },
      });
      if (!newShelf) throw new NotFoundException('ບໍ່ພົບຊັ້ນວາງໃໝ່ໃນລະບົບ');

      // BRANCH_ADMIN: shelf ใหม่ต้องอยู่ใน department เดียวกัน
      if (user.role === Role.BRANCH_ADMIN) {
        if (newShelf.locker?.warehouse?.departmentId !== user.departmentId) {
          throw new ForbiddenException(
            'ທ່ານບໍ່ມີສິດຍ້າຍໂກໂນໄປຊັ້ນວາງຂອງສາຂາອື່ນ',
          );
        }
      }

      const deptCode = newShelf.locker?.warehouse?.department?.code ?? '';
      const divCode = newShelf.locker?.warehouse?.division?.code ?? newShelf.locker?.warehouse?.division?.shortName ?? '';
      const warehouseCode = newShelf.locker?.warehouse?.code ?? '';
      const lockerCode = newShelf.locker?.code ?? '';
      const shelfCode = newShelf.name ?? '';

      const locationRef = [deptCode, divCode, warehouseCode, lockerCode, shelfCode]
        .filter((c) => Boolean(c && c.trim()))
        .join('/');
      updated = await this.folderRepository.update(id, { ...dto, locationRef });
    } else {
      updated = await this.folderRepository.update(id, dto);
    }

    await this.auditService.log({
      action: 'UPDATED',
      details: `ແກ້ໄຂໂຟນເດີ: ${existing.name}`,
      entityId: id,
      entityType: 'FOLDER',
      actorId: user?.userId || user?.id,
      departmentId: user?.departmentId,
      divisionId: user?.divisionId,
      oldValue: existing,
      newValue: updated,
    });

    return updated;
  }
}
