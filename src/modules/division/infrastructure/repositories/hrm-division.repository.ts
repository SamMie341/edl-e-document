import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
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

  // ─── ດຶງຈາກລະບົບຂອງເຮົາເเอง ──────────────────────────────────────────────────
  async findAll(): Promise<Division[]> {
    const models = await this.prisma.divisionModel.findMany({
      orderBy: { name: 'asc' },
    });
    return models.map(DivisionMapper.toDomain);
  }

  // ─── ດຶງຈາກ HRM API ──────────────────────────────────────────────────────────
  async findAllExternal(): Promise<Division[]> {
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

  async findById(id: number): Promise<Division | null> {
    const model = await this.prisma.divisionModel.findUnique({ where: { id } });
    if (!model) return null;
    return DivisionMapper.toDomain(model);
  }

  async create(data: any): Promise<Division> {
    let id = data.id;
    if (!id) {
      const last = await this.prisma.divisionModel.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      id = (last?.id ?? 0) + 1;
    }

    const model = await this.prisma.divisionModel.create({
      data: {
        id,
        code: data.code,
        name: data.name,
        shortName: data.shortName ?? data.name,
        status: data.status ?? 'A',
        departmentId: data.departmentId ?? null,
      },
    });
    return DivisionMapper.toDomain(model);
  }

  async update(id: number, data: any): Promise<Division> {
    const existing = await this.prisma.divisionModel.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('ບໍ່ພົບພະແນກນີ້ໃນລະບົບ');
    }

    const model = await this.prisma.divisionModel.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code }),
        ...(data.name && { name: data.name }),
        ...(data.shortName && { shortName: data.shortName }),
        ...(data.status && { status: data.status }),
        ...(data.departmentId !== undefined && { departmentId: data.departmentId }),
      },
    });
    return DivisionMapper.toDomain(model);
  }

  async delete(id: number): Promise<void> {
    const existing = await this.prisma.divisionModel.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('ບໍ່ພົບພະແນກນີ້ໃນລະບົບ');
    }

    const countUserDivs = await this.prisma.userDivisionModel.count({ where: { divisionId: id } });
    const countDocs = await this.prisma.documentModel.count({ where: { divisionId: id } });
    const countWarehouses = await this.prisma.warehouseModel.count({ where: { divisionId: id } });

    if (countUserDivs > 0 || countDocs > 0 || countWarehouses > 0) {
      throw new BadRequestException('ບໍ່ສາມາດລຶບພະແນກນີ້ໄດ້ ເນື່ອງຈາກມີຂໍ້ມູນຜູ້ໃຊ້, ເອກະສານ ຫຼື ສາງ ທີ່ກ່ຽວຂ້ອງ');
    }

    await this.prisma.divisionModel.delete({ where: { id } });
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
