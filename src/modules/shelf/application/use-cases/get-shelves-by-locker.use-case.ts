import { Inject, Injectable } from '@nestjs/common';
import * as shelfRepositoriesInterface from '../../domain/repositories/shelf.repositories.interface';

@Injectable()
export class GetShelvesByLockerUseCase {
  constructor(
    @Inject(shelfRepositoriesInterface.SHELF_REPOSITORY)
    private readonly shelfRepository: shelfRepositoriesInterface.IShelfRepository,
  ) {}

  async execute(lockerId: string) {
    return await this.shelfRepository.findByLockerId(lockerId);
  }
}
