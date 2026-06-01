import { Inject, Injectable } from '@nestjs/common';
import * as warehouseRepositoryInterface from 'src/modules/warehouse/domain/repositories/warehouse.repository.interface';
import * as lockerRepositoryInterface from '../../domain/repositories/locker.repository.interface';

@Injectable()
export class GetLockersByWarehouseUseCase {
  constructor(
    @Inject(lockerRepositoryInterface.LOCKER_REPOSITORY)
    private readonly lockerRepository: lockerRepositoryInterface.ILockerRepository,
  ) {}

  async execute(warehouseId: string) {
    return await this.lockerRepository.findByWarehouseId(warehouseId);
  }
}
