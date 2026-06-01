import { Inject, Injectable } from '@nestjs/common';
import * as shelfRepositoriesInterface from '../../domain/repositories/shelf.repositories.interface';
import { PaginatedResult } from 'src/core/interfaces/paginated-result.interface';

@Injectable()
export class GetAllShelvesUseCase {
  constructor(
    @Inject(shelfRepositoriesInterface.SHELF_REPOSITORY)
    private readonly shelfRepository: shelfRepositoriesInterface.IShelfRepository,
  ) {}

  async execute(
    params: shelfRepositoriesInterface.ShelfFilterParams,
  ): Promise<PaginatedResult<any>> {
    const { data, total } = await this.shelfRepository.findAll(params);
    const page = params.page || 1;
    const limit = params.limit || 10;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages },
    };
  }
}
