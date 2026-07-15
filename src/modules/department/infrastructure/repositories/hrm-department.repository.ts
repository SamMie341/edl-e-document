import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { IDepartmentRepository } from '../../domain/repositories/department.repository.interface';
import { Department } from '../../domain/entities/department.entity';
import { DepartmentMapper } from '../mappers/department.mapper';
import { PrismaService } from 'src/core/database/prisma.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class HrmDepartmentRepository implements IDepartmentRepository {
  private readonly logger = new Logger(HrmDepartmentRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) { }

  async findById(id: number): Promise<Department | null> {
    const model = await this.prisma.departmentModel.findUnique({ where: { id } });
    if (!model) return null;
    return DepartmentMapper.toDomain(model);
  }

  // ─── ດຶງຈາກລະບົບຂອງເຮົາເອງ ──────────────────────────────────────────────────
  async findAll(): Promise<Department[]> {
    const models = await this.prisma.departmentModel.findMany({
      orderBy: { id: 'asc' },
    });
    return models.map(DepartmentMapper.toDomain);
  }

  // ─── ດຶງຈາກ HRM API ──────────────────────────────────────────────────────────
  async findAllExternal(): Promise<Department[]> {
    const hrmUrl = process.env.HRM_API_URL_DEPARTMENT;
    if (!hrmUrl) {
      this.logger.warn('HRM_API_URL_DEPARTMENT ບໍ່ໄດ້ຖືກຕັ້ງໃນ .env — ຂ້າມ sync');
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
      this.logger.log(`HRM API: ໄດ້ຮັບ ${raw.length} ຝ່າຍ(Department)`);
      return raw.map(DepartmentMapper.toDomain);
    } catch (error) {
      this.logger.error(`ບໍ່ສາມາດດຶງຂໍ້ມູນ Department ຈາກ HRM: ${error.message}`);
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
