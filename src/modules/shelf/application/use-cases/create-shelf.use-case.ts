import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as shelfRepositoriesInterface from '../../domain/repositories/shelf.repositories.interface';
import { CreateShelfDto, CreateShelvesDto } from '../dtos/create-shelf.dto';
import { Role } from 'src/core/auth/constants/role.enum';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class CreateShelfUseCase {
  constructor(
    @Inject(shelfRepositoriesInterface.SHELF_REPOSITORY)
    private readonly shelfRepository: shelfRepositoriesInterface.IShelfRepository,
    private readonly prisma: PrismaService,
  ) { }

  async execute(dto: CreateShelvesDto, user: any) {
    // ── Check all shelves ──────────────────────────────────────────────────
    for (const shelfDto of dto.shelves) {
      const locker = await this.prisma.lockerModel.findUnique({
        where: { id: shelfDto.lockerId },
        include: { warehouse: true },
      });
      if (!locker) {
        throw new NotFoundException(`ບໍ່ພົບຕູ້ Locker ID '${shelfDto.lockerId}' ນີ້ໃນລະບົບ`);
      }

      if (user.role === Role.BRANCH_ADMIN) {
        if (locker.warehouse?.departmentId !== user.departmentId) {
          throw new ForbiddenException(
            `ທ່ານບໍ່ມີສິດສ້າງຊັ້ນວາງໃນຕູ້ Locker '${locker.name || locker.code}' ຂອງພະແນກອື່ນ`,
          );
        }
      }
    }

    return await this.shelfRepository.createMany(dto.shelves);
  }
}
