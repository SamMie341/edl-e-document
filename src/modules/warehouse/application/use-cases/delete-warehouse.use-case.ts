import { Inject, Injectable } from '@nestjs/common';
import * as warehouseRepositoryInterface from '../../domain/repositories/warehouse.repository.interface';

@Injectable()
export class DeleteWarehouseUseCase {
  constructor(
    @Inject(warehouseRepositoryInterface.WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: warehouseRepositoryInterface.IWarehouseRepository,
  ) {}

  async execute(id: string): Promise<void> {
    await this.warehouseRepository.delete(id);
  }
}
