import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as warehouseRepositoryInterface from '../../domain/repositories/warehouse.repository.interface';

@Injectable()
export class GetWarehouseByIdUseCase {
  constructor(
    @Inject(warehouseRepositoryInterface.WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: warehouseRepositoryInterface.IWarehouseRepository,
  ) {}

  async execute(id: string) {
    const warehouse = await this.warehouseRepository.findById(id);
    if (!warehouse) {
      throw new NotFoundException('ບໍ່ພົບສາງນີ້ໃນລະບົບ');
    }
    return warehouse;
  }
}
