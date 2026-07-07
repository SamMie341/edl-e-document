import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { IUnitRepository } from '../../domain/repositories/unit.repository.interface';
import { Unit } from '../../domain/entities/unit.entity';
import { UnitMapper } from '../mapper/unit.mapper';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HrmUnitRepository implements IUnitRepository {
  private readonly logger = new Logger(HrmUnitRepository.name);

  constructor(private readonly httpService: HttpService) {}

  // ─── ດຶງຈາກ HRM API ──────────────────────────────────────────────────────────
  async findAll(): Promise<Unit[]> {
    // Unit ໃຊ້ HRM_API_URL (URL ຫຼັກ) + /unit ຫຼືທ່ານ admin ກຳນົດເອງ
    const hrmUrl = process.env.HRM_UNIT_API_URL ?? `${process.env.HRM_API_URL}/unit`;
    if (!process.env.HRM_API_URL && !process.env.HRM_UNIT_API_URL) {
      this.logger.warn('HRM_API_URL ບໍ່ໄດ້ຖືກຕັ້ງໃນ .env — ຂ້າມ sync');
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
      this.logger.log(`HRM API: ໄດ້ຮັບ ${raw.length} ໜ່ວຍງານ(Unit)`);
      return raw.map(UnitMapper.toDomain);
    } catch (error) {
      this.logger.error(`ບໍ່ສາມາດດຶງຂໍ້ມູນ Unit ຈາກ HRM: ${error.message}`);
      return [];
    }
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
