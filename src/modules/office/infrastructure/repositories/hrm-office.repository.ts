import { Injectable } from '@nestjs/common';
import { IOfficeRepository } from '../../domain/repositories/office.repository.interface';
import { Office } from '../../domain/entities/office.entity';
import { OfficeMapper } from '../mappers/office.mapper';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class HrmOfficeRepository implements IOfficeRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── ດຶງຈາກ local DB (sync ໄວ້ຈາກ HRM ແລ້ວ) ──────────────────────────────
  async findAll(): Promise<Office[]> {
    const models = await this.prisma.officeModel.findMany({
      orderBy: { name: 'asc' },
    });
    return models.map(OfficeMapper.toDomain);
  }
}

