import { Inject, Injectable } from '@nestjs/common';
import * as lockerRepositoryInterface from '../../domain/repositories/locker.repository.interface';

@Injectable()
export class GetAllLockersUseCase {
  constructor(
    @Inject(lockerRepositoryInterface.LOCKER_REPOSITORY)
    private readonly lockerRepository: lockerRepositoryInterface.ILockerRepository,
  ) {}

  async execute(params: lockerRepositoryInterface.LockerFilterParams) {
    const { data, total } = await this.lockerRepository.findAll(params);
    return {
      data,
      meta: {
        total,
        page: params.page || 1,
        limit: params.limit || 10,
        totalPages: Math.ceil(total / (params.limit || 10)),
      },
    };
  }
}
