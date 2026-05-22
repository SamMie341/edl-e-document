import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { SyncDepartmentUseCase } from "src/modules/department/application/use-cases/sync-department.use-case";
import { SyncDivisionUseCase } from "src/modules/division/application/use-cases/sync-divisions.use-case";
import { SyncOfficesUseCase } from "src/modules/office/application/use-cases/sync-offices.use-case";
import { SyncUnitUseCase } from "src/modules/unit/application/use-cases/sync-units.use-case";

@Injectable()
export class HrmSyncTask {
    private readonly logger = new Logger(HrmSyncTask.name);

    constructor(
        private readonly syncDepartmentsUseCase: SyncDepartmentUseCase,
        private readonly syncDivisionsUseCase: SyncDivisionUseCase,
        private readonly syncOfficesUseCase: SyncOfficesUseCase,
        private readonly syncUnitsUseCase: SyncUnitUseCase,
    ) { }

    @Cron(CronExpression.EVERY_2ND_MONTH)
    async handleCron() {
        this.logger.log('ເລີ່ມຕົ້ນການ Sync ຂໍ້ມູນຈາກ HRMS ອັດຕະໂນມັດ');

        try {
            this.logger.log('ກຳລັງ Sync ຝ່າຍ(Department)...');
            await this.syncDepartmentsUseCase.execute();

            this.logger.log('ກຳລັງ Sync ພະແນກ(Division)...');
            await this.syncDivisionsUseCase.execute();

            this.logger.log('ກຳລັງ Sync ຫ້ອງການ ຫຼື ສາຂາ(Office)...');
            await this.syncOfficesUseCase.execute();

            this.logger.log('ກຳລັງ Sync ໜ່ວຍງານ(Units)...');
            await this.syncUnitsUseCase.execute();

        } catch (error) {
            this.logger.log(`❌ ເກີດຂໍ້ຜິດພາດໃນການ Sync: ${error.message}`, error.stack);
        }
    }

    // async onModuleInit() {
    //     this.logger.log('🚀 ກຳລັງກວດສອບສະຖານະຂໍ້ມູນ...');
    //     await this.handleCron();
    // }

}