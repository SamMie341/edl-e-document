import { Inject, Injectable } from '@nestjs/common';
import * as folderRepositoryInterface from '../../domain/repositories/folder.repository.interface';
import { PaginatedResult } from 'src/core/interfaces/paginated-result.interface';

@Injectable()
export class GetAllFolderUseCase {
  constructor(
    @Inject(folderRepositoryInterface.FOLDER_REPOSITORY)
    private readonly folderRepository: folderRepositoryInterface.IFolderRepository,
  ) { }

  async execute(
    params: folderRepositoryInterface.FolderFilterParams = {},
  ): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, ...rest } = params;
    const skip = (page - 1) * limit;
    const { data, total } = await this.folderRepository.findAll({
      skip,
      take: limit,
      ...rest,
    });
    const totalPages = Math.ceil(total / limit);

    return { data, meta: { total, page, limit, totalPages } };
  }
}
