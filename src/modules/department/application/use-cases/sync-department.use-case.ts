import { Inject, Injectable, Logger } from '@nestjs/common';
import * as departmentRepositoryInterface from '../../domain/repositories/department.repository.interface';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class SyncDepartmentUseCase {
  private readonly logger = new Logger(SyncDepartmentUseCase.name);

  constructor(
    @Inject(departmentRepositoryInterface.DEPARTMENT_REPOSITORY)
    private readonly externalRepo: departmentRepositoryInterface.IDepartmentRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(): Promise<{ imported: number; updated: number }> {
    this.logger.log('Start Sync Data from HRMS...');
    const externalDepartments = await this.externalRepo.findAllExternal();

    let count = 0;

    await Promise.all(
      externalDepartments.map(async (dept) => {
        await this.prisma.departmentModel.upsert({
          where: { id: dept.id },
          update: {
            code: dept.code,
            name: dept.name,
            phone: dept.phone,
            email: dept.email,
            status: dept.status,
            updatedAt: new Date(),
          },
          create: {
            id: dept.id,
            code: dept.code,
            name: dept.name,
            phone: dept.phone,
            email: dept.email,
            status: dept.status,
          },
        });
        count++;
      }),
    );

    this.logger.log(`Sync Data Success ${count}`);
    return { imported: count, updated: count };
  }
}
