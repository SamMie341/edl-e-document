import { Inject, Injectable } from '@nestjs/common';
import * as shelfRepositoriesInterface from '../../domain/repositories/shelf.repositories.interface';

@Injectable()
export class DeleteShelfUseCase {
  constructor(
    @Inject(shelfRepositoriesInterface.SHELF_REPOSITORY)
    private readonly shelfRepository: shelfRepositoriesInterface.IShelfRepository,
  ) { }

  async execute(id: string): Promise<void> {
    await this.shelfRepository.delete(id);
  }
}
