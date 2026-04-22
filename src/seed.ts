import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { Role } from './core/auth/constants/role.enum';

async function bootstrap() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    console.log('🌱 ເລີ່ມຕົ້ນຈຳລອງຂໍ້ມູນ (Seeding)...');

    try {
        const hqBranchId = 'branch-hq-001';
        const cnxBranchId = 'branch-cnx-001';
        const vteBranchId = 'branch-vte-001';

        // 1. ສ້າງຂໍ້ມູນສາຂາ (Branches)
        console.log('🏢 ກຳລັງສ້າງຂໍ້ມູນສາຂາ (Branches)...');
        await prisma.branchModel.upsert({
            where: { id: hqBranchId },
            update: { name: 'ສຳນັກງານໃຫຍ່ (HQ)', address: 'ນະຄອນຫຼວງວຽງຈັນ' },
            create: { id: hqBranchId, name: 'ສຳນັກງານໃຫຍ່ (HQ)', address: 'ນະຄອນຫຼວງວຽງຈັນ' },
        });

        await prisma.branchModel.upsert({
            where: { id: cnxBranchId },
            update: { name: 'ສາຂາ ຊຽງຂວາງ', address: 'ແຂວງຊຽງຂວາງ' },
            create: { id: cnxBranchId, name: 'ສາຂາ ຊຽງຂວາງ', address: 'ແຂວງຊຽງຂວາງ' },
        });

        await prisma.branchModel.upsert({
            where: { id: vteBranchId },
            update: { name: 'ສາຂາ ວຽງຈັນ (VTE)', address: 'ນະຄອນຫຼວງວຽງຈັນ' },
            create: { id: vteBranchId, name: 'ສາຂາ ວຽງຈັນ (VTE)', address: 'ນະຄອນຫຼວງວຽງຈັນ' },
        });

        const salt = await bcrypt.genSalt(10);
        const defaultPassword = await bcrypt.hash('password123', salt);

        // 2. ສ້າງຂໍ້ມູນຜູ້ໃຊ້ (Users)
        console.log('👥 ກຳລັງສ້າງຂໍ້ມູນຜູ້ໃຊ້ (Users)...');
        
        const usersToSeed = [
            { username: 'superadmin', role: Role.SUPER_ADMIN, branchId: hqBranchId },
            { username: 'hqadmin', role: Role.HQ_ADMIN, branchId: hqBranchId },
            { username: 'branchadmin_cnx', role: Role.BRANCH_ADMIN, branchId: cnxBranchId },
            { username: 'branchadmin_vte', role: Role.BRANCH_ADMIN, branchId: vteBranchId },
            { username: 'user1_cnx', role: Role.USER, branchId: cnxBranchId },
            { username: 'user2_vte', role: Role.USER, branchId: vteBranchId },
        ];

        for (const userData of usersToSeed) {
            const user = await prisma.userModel.upsert({
                where: { username: userData.username },
                update: { password: defaultPassword, role: userData.role, branchId: userData.branchId },
                create: {
                    username: userData.username,
                    password: defaultPassword,
                    role: userData.role,
                    branchId: userData.branchId,
                },
            });
            console.log(`✅ Created ${userData.role}: ${user.username}`);
        }

        console.log('🎉 Seeding ສຳເລັດຮຽບຮ້ອຍ!');
    } catch (error) {
        console.error('❌ ເກີດຂໍ້ຜິດພາດໃນການ Seeding:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
        process.exit(0);
    }
}

bootstrap();