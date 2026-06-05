import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import * as warehouseRepositoryInterface from '../../domain/repositories/warehouse.repository.interface';
import { CreateWarehouseDto } from '../dtos/create-warehouse.dto';
import { Role } from 'src/core/auth/constants/role.enum';

@Injectable()
export class CreateWarehouseUseCase {
  constructor(
    @Inject(warehouseRepositoryInterface.WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: warehouseRepositoryInterface.IWarehouseRepository,
  ) {}

  async execute(dto: CreateWarehouseDto, user: any) {
    if (user.role === Role.BRANCH_ADMIN) {
      // Force values from token, ignoring what frontend sends
      dto.branchId = user.branchId;
      dto.divisionId = user.divisionId;
    }
    return await this.warehouseRepository.create(dto);
  }
}
