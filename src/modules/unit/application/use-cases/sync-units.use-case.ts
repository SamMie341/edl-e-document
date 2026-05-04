import { Inject, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";
import * as unitRepositoryInterface from "../../domain/repositories/unit.repository.interface";

@Injectable()
export class SyncUnitUseCase {
    private readonly logger = new Logger(SyncUnitUseCase.name);

    constructor(
        @Inject(unitRepositoryInterface.UNIT_REPOSITORY)
        private readonly externalRepo: unitRepositoryInterface.IUnitRepository,
        private readonly prisma: PrismaService,
    ) { }

    async execute() {
        this.logger.log('กำลังเริ่มต้น Sync ข้อมูลหนวยงาน จาก HRMS...');
        try {
            const externalUnit = await this.externalRepo.findAll();
            let successCount = 0;

            // 🌟 1. เปลี่ยนมาใช้ for...of แทน Promise.all เพื่อความชัวร์และเช็ค DB ได้แม่นยำ
            for (const rawUnit of externalUnit) {

                // ========================================================
                // 🛡️ ตรวจสอบ Foreign Key แบบรัดกุม (ป้องกัน P2003 Error)
                // ========================================================
                let validDivId;
                // เช็คว่ามีค่า และ ค่าต้องไม่เป็น 0
                if (rawUnit.divisionId && Number(rawUnit.divisionId) !== 0) {
                    const exist = await this.prisma.divisionModel.findUnique({
                        where: { id: Number(rawUnit.divisionId) }
                    });
                    if (exist) validDivId = exist.id;
                }

                let validOfficeId;
                // เช็คว่ามีค่า และ ค่าต้องไม่เป็น 0
                if (rawUnit.officeId && Number(rawUnit.officeId) !== 0) {
                    const exist = await this.prisma.officeModel.findUnique({
                        where: { id: Number(rawUnit.officeId) }
                    });
                    if (exist) validOfficeId = exist.id;
                }
                // ========================================================

                // 🌟 2. อัปเดตหรือสร้างใหม่ด้วย ID ที่ตรวจสอบแล้ว (ถ้าไม่มีจะเป็น null)
                await this.prisma.unitModel.upsert({
                    where: { id: Number(rawUnit.id) },
                    update: {
                        code: rawUnit.code,
                        name: rawUnit.name,
                        type: rawUnit.type,
                        status: rawUnit.status,
                        divisionId: validDivId, // ใช้ตัวแปรที่เช็คแล้ว
                        officeId: validOfficeId, // ใช้ตัวแปรที่เช็คแล้ว
                        updatedAt: new Date(),
                    },
                    create: {
                        id: Number(rawUnit.id),
                        code: rawUnit.code,
                        name: rawUnit.name,
                        type: rawUnit.type,
                        status: rawUnit.status,
                        divisionId: validDivId, // ใช้ตัวแปรที่เช็คแล้ว
                        officeId: validOfficeId, // ใช้ตัวแปรที่เช็คแล้ว
                    }
                });

                successCount++;
            }

            this.logger.log(`✅ Sync สำเร็จ ${successCount} รายการ`);
            return { imported: successCount };

        } catch (error) {
            this.logger.error(`❌ Sync ผิดพลาด: ${error.message}`);

            // 🌟 3. แก้บั๊ก Cannot read properties of undefined
            // ต้องตรวจสอบก่อนว่า error นั้นมี .response (มาจาก Axios) หรือไม่
            if (error.response) {
                this.logger.log(`HRM API Error Data:`, error.response.data);
            }

            throw new InternalServerErrorException('ไม่สามารถ Sync ข้อมูลหน่วยงาน จาก HRMS ได้');
        }
    }
}