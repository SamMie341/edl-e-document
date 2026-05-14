import 'dotenv/config';
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaClient.name);
    constructor() {
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });
        const adapter = new PrismaPg(pool);
        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
        await this.seedSuperAdmin();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }

    private async seedSuperAdmin() {
        try {
            const superAdminEmail = 'superadmin@edl.com.la';
            // 1. ກວດເບິ່ງວ່າມີ superadmin ໃນລະບົບແລ້ວຫຼືຍັງ?
            const adminExist = await this.userModel.findUnique({
                where: { email: superAdminEmail },
            });

            // 2. ຖ້າຍັງບໍ່ມີ ໃຫ້ສ້າງໃໝ່
            if (!adminExist) {
                this.logger.log('🌱 ບໍ່ພົບ Super Admin ໃນລະບົບ, ກຳລັງສ້າງໃໝ່...');

                const defaultPassword = 'AdminPassword123!';
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(defaultPassword, salt);

                await this.userModel.create({
                    data: {
                        email: superAdminEmail,
                        password: hashedPassword,
                        role: 'SUPER_ADMIN',
                        empCode: 'ADMIN000',
                        empId: 0,
                        firstNameLa: 'ຜູ້ເບິ່ງແຍງລະບົບ',
                        lastNameLa: 'ສູງສຸດ',
                        firstNameEng: 'Super',
                        lastNameEng: 'Admin',
                        status: 'A',
                    },
                });

                this.logger.log('✅ ສ້າງບັນຊີ Super Admin ສຳເລັດແລ້ວ!');
                this.logger.log(`👤 Username: superadmin`);
                this.logger.log(`🔑 Password: ${defaultPassword}`);
            }
        } catch (error) {
            this.logger.error('❌ ບໍ່ສາມາດສ້າງ Super Admin ໄດ້:', error.message);
        }
    }
}
