import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import * as warehouseRepositoryInterface from '../../domain/repositories/warehouse.repository.interface';
import { UpdateWarehouseDto } from '../dtos/update-warehouse.dto';
import { Role } from 'src/core/auth/constants/role.enum';

@Injectable()
export class UpdateWarehouseUseCase {
  constructor(
    @Inject(warehouseRepositoryInterface.WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: warehouseRepositoryInterface.IWarehouseRepository,
  ) {}

  async execute(id: string, dto: UpdateWarehouseDto, user: any) {
    // BRANCH_ADMIN ສາມາດແກ້ໄຂໄດ້ສະເພາະ branch ຕົນເອງ
    if (user.role === Role.BRANCH_ADMIN && dto.branchId !== undefined) {
      if (dto.branchId !== user.branchId) {
        throw new ForbiddenException('ທ່ານບໍ່ມີສິດແກ້ໄຂສາງຂອງສາຂາອື່ນ');
      }
    }
    return await this.warehouseRepository.update(id, dto);
  }
}
