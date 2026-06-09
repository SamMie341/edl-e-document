import { Inject, Injectable } from '@nestjs/common';
import * as warehouseRepositoryInterface from '../../domain/repositories/warehouse.repository.interface';
import { UpdateWarehouseDto } from '../dtos/update-warehouse.dto';

@Injectable()
export class UpdateWarehouseUseCase {
  constructor(
    @Inject(warehouseRepositoryInterface.WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: warehouseRepositoryInterface.IWarehouseRepository,
  ) { }

  async execute(id: string, dto: UpdateWarehouseDto) {
    return await this.warehouseRepository.update(id, dto);
  }
}
