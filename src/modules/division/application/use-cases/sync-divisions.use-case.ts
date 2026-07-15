import {
  Inject,
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import * as divisionRepositoryInterface from '../../domain/repositories/division.repository.interface';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class SyncDivisionUseCase {
  private readonly logger = new Logger(SyncDivisionUseCase.name);

  constructor(
    @Inject(divisionRepositoryInterface.DIVISION_REPOSITORY)
    private readonly externalRepo: divisionRepositoryInterface.IDivisionRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute() {
    this.logger.log('ກຳລັງເລີ່ມຕົ້ນ Sync ຂໍ້ມູນ Division...');

    try {
      const externalDivisions = await this.externalRepo.findAllExternal();
      let count = 0;

      // 🌟 ປ່ຽນມາໃຊ້ for...of ຄືກັນກັບໂມດູນ Unit ເພື່ອຄວາມປອດໄພ
      for (const div of externalDivisions) {
        // ========================================================
        // 🛡️ 1. ກວດສອບ Department Foreign Key
        // ========================================================
        let validDeptId;
        if (div.departmentId && Number(div.departmentId) !== 0) {
          const exist = await this.prisma.departmentModel.findUnique({
            where: { id: Number(div.departmentId) },
          });
          if (exist) validDeptId = exist.id;
        }

        // ========================================================
        // 🌟 2. ບັນທຶກ Division ລົງ Database
        // ========================================================
        await this.prisma.divisionModel.upsert({
          where: { id: Number(div.id) },
          update: {
            code: div.code,
            name: div.name,
            shortName: div.shortName ?? '',
            status: div.status,
            departmentId: validDeptId,
            updatedAt: new Date(),
          },
          create: {
            id: Number(div.id),
            code: div.code,
            name: div.name,
            shortName: div.shortName ?? '',
            status: div.status,
            departmentId: validDeptId,
          },
        });

        count++;
      }

      this.logger.log(`✅ Sync ສຳເລັດຈຳນວນ ${count} ລາຍການ`);
      return { imported: count };
    } catch (error) {
      this.logger.error(`❌ Sync ຜິດພາດ: ${error.message}`);
      throw new InternalServerErrorException(
        'ບໍ່ສາມາດ Sync ຂໍ້ມູນ Division ໄດ້',
      );
    }
  }
}
