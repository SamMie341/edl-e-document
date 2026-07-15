import { Inject, Injectable } from '@nestjs/common';
import * as warehouseRepositoryInterface from '../../domain/repositories/warehouse.repository.interface';

@Injectable()
export class GetWarehouseDropdownUseCase {
  constructor(
    @Inject(warehouseRepositoryInterface.WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: warehouseRepositoryInterface.IWarehouseRepository,
  ) {}

  async execute(filters?: { departmentId?: number; divisionId?: number; divisionIds?: number[] }) {
    return await this.warehouseRepository.getDropdown(filters);
  }
}
