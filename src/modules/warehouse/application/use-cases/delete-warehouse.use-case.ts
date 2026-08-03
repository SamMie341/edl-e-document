import { Inject, Injectable } from '@nestjs/common';
import * as warehouseRepositoryInterface from '../../domain/repositories/warehouse.repository.interface';
import { AuditService } from 'src/modules/audit/application/services/audit.service';
import { AuditAction } from 'src/core/constants/audit-action.enum';

@Injectable()
export class DeleteWarehouseUseCase {
  constructor(
    @Inject(warehouseRepositoryInterface.WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: warehouseRepositoryInterface.IWarehouseRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(id: string, user?: any): Promise<void> {
    await this.warehouseRepository.delete(id);
    await this.auditService.log({
      action: AuditAction.DELETED,
      details: `ລຶບສາງເກັບເອກະສານ ID: ${id}`,
      entityId: id,
      entityType: 'WAREHOUSE',
      actorId: user?.userId || user?.id,
      departmentId: user?.departmentId,
      divisionId: user?.divisionId,
    });
  }
}
