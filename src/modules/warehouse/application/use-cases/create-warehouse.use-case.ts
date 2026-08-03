import { Inject, Injectable } from '@nestjs/common';
import * as warehouseRepositoryInterface from '../../domain/repositories/warehouse.repository.interface';
import { CreateWarehouseDto } from '../dtos/create-warehouse.dto';
import { AuditService } from 'src/modules/audit/application/services/audit.service';
import { AuditAction } from 'src/core/constants/audit-action.enum';

@Injectable()
export class CreateWarehouseUseCase {
  constructor(
    @Inject(warehouseRepositoryInterface.WAREHOUSE_REPOSITORY)
    private readonly warehouseRepository: warehouseRepositoryInterface.IWarehouseRepository,
    private readonly auditService: AuditService,
  ) { }

  async execute(dto: CreateWarehouseDto, user?: any) {
    const created = await this.warehouseRepository.create(dto);
    await this.auditService.log({
      action: AuditAction.CREATED,
      details: `ສ້າງສາງເກັບເອກະສານ: ${created.name}`,
      entityId: created.id,
      entityType: 'WAREHOUSE',
      actorId: user?.userId || user?.id,
      departmentId: user?.departmentId,
      divisionId: user?.divisionId,
    });
    return created;
  }
}
