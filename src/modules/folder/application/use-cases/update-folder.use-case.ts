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

@Injectable()
export class UpdateFolderUseCase {
  constructor(
    @Inject(folderRepositoryInterface.FOLDER_REPOSITORY)
    private readonly folderRepository: folderRepositoryInterface.IFolderRepository,
    private readonly prisma: PrismaService,
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

    // BRANCH_ADMIN: ตรวจสอบว่า folder นี้อยู่ใน address ตัวเอง
    if (user.role === Role.BRANCH_ADMIN) {
      const warehouseAddress = existing.shelf?.locker?.warehouse?.addressId;
      if (warehouseAddress !== user.addressId) {
        throw new ForbiddenException('ທ່ານບໍ່ມີສິດແກ້ໄຂໂກໂນຂອງສາຂາອື່ນ');
      }
    }

    // ถ้ามีการเปลี่ยน shelfId → recalculate locationRef
    if (dto.shelfId && dto.shelfId !== existing.shelfId) {
      const newShelf = await this.prisma.shelfModel.findUnique({
        where: { id: dto.shelfId },
        include: {
          locker: {
            include: { warehouse: { include: { address: true } } },
          },
        },
      });
      if (!newShelf) throw new NotFoundException('ບໍ່ພົບຊັ້ນວາງໃໝ່ໃນລະບົບ');

      // BRANCH_ADMIN: shelf ใหม่ต้องอยู่ใน branch เดียวกัน
      if (user.role === Role.BRANCH_ADMIN) {
        if (newShelf.locker?.warehouse?.addressId !== user.addressId) {
          throw new ForbiddenException(
            'ທ່ານບໍ່ມີສິດຍ້າຍໂກໂນໄປຊັ້ນວາງຂອງສາຂາອື່ນ',
          );
        }
      }

      const locationRef = `${newShelf.locker?.warehouse?.address?.code}/${newShelf.locker?.warehouse?.code}/${newShelf.locker?.code}`;
      return await this.folderRepository.update(id, { ...dto, locationRef });
    }

    return await this.folderRepository.update(id, dto);
  }
}
