import { Inject, Injectable } from '@nestjs/common';
import * as warehouseRepositoryInterface from '../../domain/repositories/warehouse.repository.interface';
import { CreateWarehouseDto } from '../dtos/create-warehouse.dto';

@Injectable()
export class CreateWarehouseUseCase {
  constructor(
    @Inject(warehouseRepositoryInterface.WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: warehouseRepositoryInterface.IWarehouseRepository,
  ) { }

  async execute(dto: CreateWarehouseDto) {
    return await this.warehouseRepository.create(dto);
  }
}
