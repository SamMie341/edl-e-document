import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { Role } from 'src/core/auth/constants/role.enum';

@Injectable()
export class GetWarehouseBranchDropdownUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(user: any) {
    let condition: any = {};
    let divisionQuery: any = true;
    let addressQuery: any = true;

    if (user.role !== Role.HQ_ADMIN) {
      condition = user.branchId ? { id: Number(user.branchId) } : { id: -1 };

      if (user.divisionId) {
        divisionQuery = { where: { id: Number(user.divisionId) } };
        addressQuery = { where: { divisionId: Number(user.divisionId) } };
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
