import { Inject, Injectable } from '@nestjs/common';
import * as folderRepositoryInterface from '../../domain/repositories/folder.repository.interface';

@Injectable()
export class GetFolderDropdownUseCase {
  constructor(
    @Inject(folderRepositoryInterface.FOLDER_REPOSITORY)
    private readonly folderRepository: folderRepositoryInterface.IFolderRepository,
  ) {}

  async execute(params?: folderRepositoryInterface.FolderFilterParams) {
    return this.folderRepository.getDropdown(params);
  }
}
