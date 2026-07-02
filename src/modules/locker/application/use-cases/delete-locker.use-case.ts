import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import * as lockerRepositoryInterface from '../../domain/repositories/locker.repository.interface';
import { Role } from 'src/core/auth/constants/role.enum';

@Injectable()
export class DeleteLockerUseCase {
  constructor(
    @Inject(lockerRepositoryInterface.LOCKER_REPOSITORY)
    private readonly lockerRepository: lockerRepositoryInterface.ILockerRepository,
  ) { }

  async execute(id: string, user: any): Promise<void> {
    if (user.role === Role.USER) {
      throw new ForbiddenException('ທ່ານບໍ່ມີສິດລົບຕູ້ Locker ໄດ້');
    }
    await this.lockerRepository.delete(id);
  }
}
