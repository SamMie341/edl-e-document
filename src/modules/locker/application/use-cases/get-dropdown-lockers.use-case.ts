import { Inject, Injectable } from '@nestjs/common';
import * as lockerRepositoryInterface from '../../domain/repositories/locker.repository.interface';

@Injectable()
export class GetDropdownLockersUseCase {
  constructor(
    @Inject(lockerRepositoryInterface.LOCKER_REPOSITORY)
    private readonly lockerRepository: lockerRepositoryInterface.ILockerRepository,
  ) { }

  async execute(params: {
    warehouseId?: string;
    departmentId?: number;
    divisionId?: number;
    divisionIds?: number[];
    status?: string;
  }) {
    return this.lockerRepository.getDropdown(params);
  }
}
