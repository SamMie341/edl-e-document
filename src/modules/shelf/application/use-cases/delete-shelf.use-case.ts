import { Inject, Injectable } from '@nestjs/common';
import * as shelfRepositoriesInterface from '../../domain/repositories/shelf.repositories.interface';
import { AuditService } from 'src/modules/audit/application/services/audit.service';
import { AuditAction } from 'src/core/constants/audit-action.enum';

@Injectable()
export class DeleteShelfUseCase {
  constructor(
    @Inject(shelfRepositoriesInterface.SHELF_REPOSITORY)
    private readonly shelfRepository: shelfRepositoriesInterface.IShelfRepository,
    private readonly auditService: AuditService,
  ) { }

  async execute(id: string, user?: any): Promise<void> {
    await this.shelfRepository.delete(id);
    await this.auditService.log({
      action: AuditAction.DELETED,
      details: `ລຶບຊັ້ນວາງ ID: ${id}`,
      entityId: id,
      entityType: 'SHELF',
      actorId: user?.userId || user?.id,
      departmentId: user?.departmentId,
      divisionId: user?.divisionId,
    });
  }
}
