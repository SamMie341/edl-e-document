import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as lockerRepositoryInterface from '../../domain/repositories/locker.repository.interface';
import { Locker } from '../../domain/entities/locker.entity';

@Injectable()
export class GetLockerByIdUseCase {
  constructor(
    @Inject(lockerRepositoryInterface.LOCKER_REPOSITORY)
    private readonly lockerRepository: lockerRepositoryInterface.ILockerRepository,
  ) {}

  async execute(id: string): Promise<Locker> {
    const locker = await this.lockerRepository.findById(id);
    if (!locker) {
      throw new NotFoundException('ບໍ່ພົບຕູ້ Locker ນີ້ໃນລະບົບ');
    }
    return locker;
  }
}
