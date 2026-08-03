import { Inject, Injectable } from '@nestjs/common';
import * as warehouseRepositoryInterface from '../../domain/repositories/warehouse.repository.interface';
import { UpdateWarehouseDto } from '../dtos/update-warehouse.dto';
import { AuditService } from 'src/modules/audit/application/services/audit.service';
import { AuditAction } from 'src/core/constants/audit-action.enum';

@Injectable()
export class UpdateWarehouseUseCase {
  constructor(
    @Inject(warehouseRepositoryInterface.WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: warehouseRepositoryInterface.IWarehouseRepository,
    private readonly auditService: AuditService,
  ) { }

  async execute(id: string, dto: UpdateWarehouseDto, user?: any) {
    const updated = await this.warehouseRepository.update(id, dto);
    await this.auditService.log({
      action: 'UPDATED',
      details: `ແກ້ໄຂສາງເກັບເອກະສານ: ${updated.name}`,
      entityId: id,
      entityType: 'WAREHOUSE',
      actorId: user?.userId || user?.id,
      departmentId: user?.departmentId,
      divisionId: user?.divisionId,
      newValue: updated,
    });
    return updated;
  }
}
