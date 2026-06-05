import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { Role } from 'src/core/auth/constants/role.enum';

@Injectable()
export class GetWarehouseBranchDropdownUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    user: any,
    filters?: { branchId?: number; divisionId?: number },
  ) {
    let condition: any = {};
    let divisionQuery: any = true;
    let addressQuery: any = true;

    if (user.role !== Role.HQ_ADMIN) {
      condition = user.branchId ? { id: Number(user.branchId) } : { id: -1 };

      // ใช้ divisionId จาก query param ก่อน, ถ้າບໍ່ມີ ໃຊ້ divisionId ຂອງ user
      const divId = filters?.divisionId ?? user.divisionId;
      if (divId) {
        divisionQuery = { where: { id: Number(divId) } };
        addressQuery = { where: { divisionId: Number(divId) } };
      }
    } else {
      // HQ_ADMIN: filter ตาม query param ที่ frontend ส่งมา
      if (filters?.branchId) {
        condition = { id: filters.branchId };
      }
      if (filters?.divisionId) {
        divisionQuery = { where: { id: filters.divisionId } };
        addressQuery = { where: { divisionId: filters.divisionId } };
      }
    }

    return await this.prisma.branchModel.findMany({
      where: condition,
      select: {
        id: true,
        name: true,
        divisions: divisionQuery,
        addresses: addressQuery,
      },
      orderBy: { name: 'asc' },
    });
  }
}
