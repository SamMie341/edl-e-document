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
    this.logger.log('ກຳລັງເລີ່ມຕົ້ນ Sync ຂໍ້ມູນ Division ແລະ Branch...');

    try {
      const externalDivisions = await this.externalRepo.findAll();
      let count = 0;

      // 🌟 ປ່ຽນມາໃຊ້ for...of ຄືກັນກັບໂມດູນ Unit ເພື່ອຄວາມປອດໄພ
      for (const div of externalDivisions) {
        // ========================================================
        // 🌟 1. ຈັດການ Branch ກ່ອນ (Upsert Branch)
        // ========================================================
        let validBranchId;
        if (div.branchData && div.branchData.branch_id) {
          await this.prisma.branchModel.upsert({
            where: { id: Number(div.branchData.branch_id) },
            update: {
              code: div.branchData.branch_code,
              name: div.branchData.branch_name,
              status: div.branchData.branch_status,
            },
            create: {
              id: Number(div.branchData.branch_id),
              code: div.branchData.branch_code,
              name: div.branchData.branch_name,
              status: div.branchData.branch_status,
            },
          });
          validBranchId = Number(div.branchData.branch_id);
        }

        // ========================================================
        // 🛡️ 2. ກວດສອບ Department Foreign Key
        // ========================================================
        let validDeptId;
        if (div.departmentId && Number(div.departmentId) !== 0) {
          const exist = await this.prisma.departmentModel.findUnique({
            where: { id: Number(div.departmentId) },
          });
          if (exist) validDeptId = exist.id;
        }

        // ========================================================
        // 🌟 3. ບັນທຶກ Division ລົງ Database
        // ========================================================
        await this.prisma.divisionModel.upsert({
          where: { id: Number(div.id) },
          update: {
            code: div.code,
            name: div.name,
            shortName: div.shortName ?? '',
            status: div.status,
            departmentId: validDeptId,
            branchId: validBranchId, // 👈 ໃຊ້ ID ຂອງ Branch ທີ່ຫາກໍສ້າງ
            updatedAt: new Date(),
          },
          create: {
            id: Number(div.id),
            code: div.code,
            name: div.name,
            shortName: div.shortName ?? '',
            status: div.status,
            departmentId: validDeptId,
            branchId: validBranchId, // 👈 ໃຊ້ ID ຂອງ Branch ທີ່ຫາກໍສ້າງ
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
