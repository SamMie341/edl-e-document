import { Inject, Injectable } from '@nestjs/common';
import * as lockerRepositoryInterface from '../../domain/repositories/locker.repository.interface';

@Injectable()
export class DeleteLockerUseCase {
  constructor(
    @Inject(lockerRepositoryInterface.LOCKER_REPOSITORY)
    private readonly lockerRepository: lockerRepositoryInterface.ILockerRepository,
  ) {}

  async execute(id: string): Promise<void> {
    await this.lockerRepository.delete(id);
  }
}
