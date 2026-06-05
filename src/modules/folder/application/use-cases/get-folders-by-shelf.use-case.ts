import { Inject, Injectable } from '@nestjs/common';
import * as folderRepositoryInterface from '../../domain/repositories/folder.repository.interface';

@Injectable()
export class GetFoldersByShelfUseCase {
  constructor(
    @Inject(folderRepositoryInterface.FOLDER_REPOSITORY)
    private readonly folderRepository: folderRepositoryInterface.IFolderRepository,
  ) {}

  async execute(shelfId: string) {
    return await this.folderRepository.findByShelfId(shelfId);
  }
}
