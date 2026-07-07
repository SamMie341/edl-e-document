import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { IOfficeRepository } from '../../domain/repositories/office.repository.interface';
import { Office } from '../../domain/entities/office.entity';
import { OfficeMapper } from '../mappers/office.mapper';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HrmOfficeRepository implements IOfficeRepository {
  private readonly logger = new Logger(HrmOfficeRepository.name);

  constructor(private readonly httpService: HttpService) {}

  // ─── ດຶງຈາກ HRM API ──────────────────────────────────────────────────────────
  async findAll(): Promise<Office[]> {
    const hrmUrl = process.env.HRM_OFFICE_API_URL;
    if (!hrmUrl) {
      this.logger.warn('HRM_OFFICE_API_URL ບໍ່ໄດ້ຖືກຕັ້ງໃນ .env — ຂ້າມ sync');
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
      this.logger.log(`HRM API: ໄດ້ຮັບ ${raw.length} ຫ້ອງການ(Office)`);
      return raw.map(OfficeMapper.toDomain);
    } catch (error) {
      this.logger.error(`ບໍ່ສາມາດດຶງຂໍ້ມູນ Office ຈາກ HRM: ${error.message}`);
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
