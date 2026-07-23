import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
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

  async create(data: any): Promise<Department> {
    let id = data.id;
    if (!id) {
      const last = await this.prisma.departmentModel.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      id = (last?.id ?? 0) + 1;
    }

    const model = await this.prisma.departmentModel.create({
      data: {
        id,
        code: data.code,
        name: data.name,
        phone: data.phone ?? null,
        email: data.email ?? null,
        status: data.status ?? 'A',
      },
    });
    return DepartmentMapper.toDomain(model);
  }

  async update(id: number, data: any): Promise<Department> {
    const existing = await this.prisma.departmentModel.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('ບໍ່ພົບຝ່າຍນີ້ໃນລະບົບ');
    }

    const model = await this.prisma.departmentModel.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code }),
        ...(data.name && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.status && { status: data.status }),
      },
    });
    return DepartmentMapper.toDomain(model);
  }

  async delete(id: number): Promise<void> {
    const existing = await this.prisma.departmentModel.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('ບໍ່ພົບຝ່າຍນີ້ໃນລະບົບ');
    }

    const countDivisions = await this.prisma.divisionModel.count({ where: { departmentId: id } });
    const countUsers = await this.prisma.userModel.count({ where: { departmentId: id } });
    const countDocs = await this.prisma.documentModel.count({ where: { departmentId: id } });

    if (countDivisions > 0 || countUsers > 0 || countDocs > 0) {
      throw new BadRequestException('ບໍ່ສາມາດລຶບຝ່າຍນີ້ໄດ້ ເນື່ອງຈາກມີຂໍ້ມູນພະແນກ, ຜູ້ໃຊ້ ຫຼື ເອກະສານ ທີ່ກ່ຽວຂ້ອງ');
    }

    await this.prisma.departmentModel.delete({ where: { id } });
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
