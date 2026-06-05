import { Inject, Injectable, Logger } from '@nestjs/common';
import * as officeRepositoryInterface from '../../domain/repositories/office.repository.interface';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class SyncOfficesUseCase {
  private readonly logger = new Logger(SyncOfficesUseCase.name);

  constructor(
    @Inject(officeRepositoryInterface.OFFICE_REPOSITORY)
    private readonly externalRepo: officeRepositoryInterface.IOfficeRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute() {
    this.logger.log('ເລິ່ມ Sync ຂໍ້ມູນພະແນກ...');
    const externalOffices = await this.externalRepo.findAll();
    let count = 0;

    await Promise.all(
      externalOffices.map(async (office) => {
        await this.prisma.officeModel.upsert({
          where: { id: office.id },
          update: {
            code: office.code,
            name: office.name,
            status: office.status,
            divisionId: office.divisionId,
            updatedAt: new Date(),
          },
          create: {
            id: office.id,
            code: office.code,
            name: office.name,
            status: office.status,
            divisionId: office.divisionId,
          },
        });
        count++;
      }),
    );

    this.logger.log(`Sync ຫ້ອງການສຳເລັດ ${count} ລາຍການ`);
    return { imported: count };
  }
}
