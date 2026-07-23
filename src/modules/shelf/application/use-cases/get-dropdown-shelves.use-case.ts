import { Inject, Injectable } from '@nestjs/common';
import * as shelfRepositoriesInterface from '../../domain/repositories/shelf.repositories.interface';

@Injectable()
export class GetDropdownShelvesUseCase {
  constructor(
    @Inject(shelfRepositoriesInterface.SHELF_REPOSITORY)
    private readonly shelfRepository: shelfRepositoriesInterface.IShelfRepository,
  ) {}

  async execute(params?: shelfRepositoriesInterface.ShelfFilterParams) {
    return this.shelfRepository.getDropdown(params);
  }
}
