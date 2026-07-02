import { Injectable } from '@nestjs/common';
import { IUnitRepository } from '../../domain/repositories/unit.repository.interface';
import { Unit } from '../../domain/entities/unit.entity';
import { UnitMapper } from '../mapper/unit.mapper';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class HrmUnitRepository implements IUnitRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── ດຶງຈາກ local DB (sync ໄວ້ຈາກ HRM ແລ້ວ) ──────────────────────────────
  async findAll(): Promise<Unit[]> {
    const models = await this.prisma.unitModel.findMany({
      orderBy: { name: 'asc' },
    });
    return models.map(UnitMapper.toDomain);
  }
}

