import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as shelfRepositoriesInterface from '../../domain/repositories/shelf.repositories.interface';
import { UpdateShelfDto } from '../dtos/update-shelf.dto';
import { Role } from 'src/core/auth/constants/role.enum';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class UpdateShelfUseCase {
  constructor(
    @Inject(shelfRepositoriesInterface.SHELF_REPOSITORY)
    private readonly shelfRepository: shelfRepositoriesInterface.IShelfRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(id: string, dto: UpdateShelfDto, user: any) {
    // Find existing shelf
    const existingShelf = await this.prisma.shelfModel.findUnique({
      where: { id },
      include: { locker: { include: { warehouse: true } } },
    });
    if (!existingShelf) {
      throw new NotFoundException('ບໍ່ພົບຊັ້ນວາງນີ້ໃນລະບົບ');
    }



    // If lockerId is being updated, verify target locker existence and permissions
    if (dto.lockerId && dto.lockerId !== existingShelf.lockerId) {
      const targetLocker = await this.prisma.lockerModel.findUnique({
        where: { id: dto.lockerId },
        include: { warehouse: true },
      });
      if (!targetLocker) {
        throw new NotFoundException('ບໍ່ພົບຕູ້ Locker ໃໝ່ໃນລະບົບ');
      }
    }
    return await this.shelfRepository.update(id, dto);
  }
}
