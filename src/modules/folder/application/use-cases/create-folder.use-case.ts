import { Inject, Injectable } from '@nestjs/common';
import * as folderRepositoryInterface from '../../domain/repositories/folder.repository.interface';
import { CreateFolderDto } from '../dtos/create-folder.dto';
import { AuditService } from 'src/modules/audit/application/services/audit.service';
import { AuditAction } from 'src/core/constants/audit-action.enum';

@Injectable()
export class CreateFolderUseCase {
  constructor(
    @Inject(folderRepositoryInterface.FOLDER_REPOSITORY)
    private readonly folderRepository: folderRepositoryInterface.IFolderRepository,
    private readonly auditService: AuditService,
  ) { }

  async execute(dto: CreateFolderDto, user?: any) {
    const createdFolder = await this.folderRepository.create(dto);
    await this.auditService.log({
      action: AuditAction.CREATED,
      details: `ສ້າງໂກໂນ: ${createdFolder.name || createdFolder.code}`,
      entityId: createdFolder.id,
      entityType: 'FOLDER',
      actorId: user?.userId || user?.id,
      departmentId: user?.departmentId,
      divisionId: user?.divisionId,
    });
    return createdFolder;
  }
}
