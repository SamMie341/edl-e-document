import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as folderRepositoryInterface from '../../domain/repositories/folder.repository.interface';
import { Role } from 'src/core/auth/constants/role.enum';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class DeleteFolderUseCase {
  constructor(
    @Inject(folderRepositoryInterface.FOLDER_REPOSITORY)
    private readonly folderRepository: folderRepositoryInterface.IFolderRepository,
    private readonly prisma: PrismaService,
  ) { }

  async execute(id: string, user: any): Promise<void> {
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

    // BRANCH_ADMIN: ลบได้เฉพาะ folder ใน branch ตัวเอง
    if (user.role === Role.BRANCH_ADMIN) {
      const warehouseBranch = existing.shelf?.locker?.warehouse?.addressId;
      if (warehouseBranch !== user.addressId) {
        throw new ForbiddenException('ທ່ານບໍ່ມີສິດລຶບໂກໂນຂອງສາຂາອື່ນ');
      }
    }

    await this.folderRepository.delete(id);
  }
}
