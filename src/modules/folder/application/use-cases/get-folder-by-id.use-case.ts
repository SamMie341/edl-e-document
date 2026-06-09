import { Inject, Injectable } from '@nestjs/common';
import * as folderRepositoryInterface from '../../domain/repositories/folder.repository.interface';
import { Folder } from '../../domain/entities/folder.entity';

@Injectable()
export class GetFolderByIdUseCase {
  constructor(
    @Inject(folderRepositoryInterface.FOLDER_REPOSITORY)
    private readonly folderRepository: folderRepositoryInterface.IFolderRepository,
  ) { }

  async execute(id: string): Promise<Folder> {
    return this.folderRepository.findById(id);
  }
}
