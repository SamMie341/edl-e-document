import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { IDivisionRepository } from '../../domain/repositories/division.repository.interface';
import { Division } from '../../domain/entities/division.entity';
import { DivisionMapper } from '../mappers/division.mapper';
import { PrismaService } from 'src/core/database/prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HrmDivisionRepository implements IDivisionRepository {
  private readonly logger = new Logger(HrmDivisionRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  // ─── ດຶງຈາກ HRM API ──────────────────────────────────────────────────────────
  async findAll(): Promise<Division[]> {
    const hrmUrl = process.env.HRM_DIVISION_API_URL;
    if (!hrmUrl) {
      this.logger.warn('HRM_DIVISION_API_URL ບໍ່ໄດ້ຖືກຕັ້ງໃນ .env — ຂ້າມ sync');
      return [];
    }

    try {
      const token = await this.getHrmToken();
      const response = await firstValueFrom(
        this.httpService.get(hrmUrl, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000,
        }),
      );

      const raw: any[] = response.data?.data ?? response.data ?? [];
      this.logger.log(`HRM API: ໄດ້ຮັບ ${raw.length} ພະແນກ(Division)`);
      return raw.map(DivisionMapper.toDomain);
    } catch (error) {
      this.logger.error(`ບໍ່ສາມາດດຶງຂໍ້ມູນ Division ຈາກ HRM: ${error.message}`);
      return [];
    }
  }

  async findByDepartment(departmentId: number): Promise<Division[]> {
    const models = await this.prisma.divisionModel.findMany({
      where: { departmentId },
      orderBy: { name: 'asc' },
    });
    return models.map(DivisionMapper.toDomain);
  }

  // ─── ຂໍ Token ຈາກ HRM Auth ────────────────────────────────────────────────────
  private async getHrmToken(): Promise<string> {
    const loginUrl = process.env.HRM_LOGIN_URL;
    const username = process.env.HRM_USERNAME;
    const password = process.env.HRM_PASSWORD;

    const response = await firstValueFrom(
      this.httpService.post(loginUrl!, { username, password }, { timeout: 10000 }),
    );

    return response.data?.access_token ?? response.data?.token;
  }
}
