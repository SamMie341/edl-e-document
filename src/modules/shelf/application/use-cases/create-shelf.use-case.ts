import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as shelfRepositoriesInterface from '../../domain/repositories/shelf.repositories.interface';
import { CreateShelfDto } from '../dtos/create-shelf.dto';
import { Role } from 'src/core/auth/constants/role.enum';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class CreateShelfUseCase {
  constructor(
    @Inject(shelfRepositoriesInterface.SHELF_REPOSITORY)
    private readonly shelfRepository: shelfRepositoriesInterface.IShelfRepository,
    private readonly prisma: PrismaService,
  ) { }

  async execute(dto: CreateShelfDto, user: any) {
    const locker = await this.prisma.lockerModel.findUnique({
      where: { id: dto.lockerId },
      include: { warehouse: true },
    });
    if (!locker) {
      throw new NotFoundException('ບໍ່ພົບຕູ້ Locker ນີ້ໃນລະບົບ');
    }

    if (user.role === Role.BRANCH_ADMIN) {
      if (locker.warehouse?.addressId !== user.addressId) {
        throw new ForbiddenException(
          'ທ່ານບໍ່ມີສິດສ້າງຊັ້ນວາງໃນຕູ້ Locker ຂອງສາຂາອື່ນ',
        );
      }
    }
    return await this.shelfRepository.create(dto);
  }
}
