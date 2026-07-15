import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as lockerRepositoryInterface from '../../domain/repositories/locker.repository.interface';
import { UpdateLockerDto } from '../dtos/update-locker.dto';
import { Role } from 'src/core/auth/constants/role.enum';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class UpdateLockerUseCase {
  constructor(
    @Inject(lockerRepositoryInterface.LOCKER_REPOSITORY)
    private readonly lockerRepository: lockerRepositoryInterface.ILockerRepository,
    private readonly prisma: PrismaService,
  ) { }

  async execute(id: string, dto: UpdateLockerDto, user: any) {
    // 1. Verify existence of locker
    const existingLocker = await this.prisma.lockerModel.findUnique({
      where: { id },
      include: { warehouse: true },
    });
    if (!existingLocker) {
      throw new NotFoundException('ບໍ່ພົບຕູ້ Locker ນີ້ໃນລະບົບ');
    }

    // 2. Branch admin check for existing locker
    if (user.role === Role.BRANCH_ADMIN) {
      if (existingLocker.warehouse?.departmentId !== user.departmentId) {
        throw new ForbiddenException('ທ່ານບໍ່ມີສິດແກ້ໄຂຕູ້ Locker ຂອງພະແນກອື່ນ');
      }
    }

    // 3. If warehouseId is updated, check target warehouse existence and permissions
    if (dto.warehouseId && dto.warehouseId !== existingLocker.warehouseId) {
      const targetWarehouse = await this.prisma.warehouseModel.findUnique({
        where: { id: dto.warehouseId },
      });
      if (!targetWarehouse) {
        throw new NotFoundException('ບໍ່ພົບສາງເອກະສານໃໝ່ນີ້ໃນລະບົບ');
      }
      if (user.role === Role.BRANCH_ADMIN) {
        if (targetWarehouse.departmentId !== user.departmentId) {
          throw new ForbiddenException(
            'ທ່ານບໍ່ມີສິດຍ້າຍຕູ້ Locker ໄປສາງຂອງພະແນກອື່ນ',
          );
        }
      }
    }

    return await this.lockerRepository.update(id, dto);
  }
}
