import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './core/database/prisma.service'; // ดึงจาก Service ของเราเอง
import * as bcrypt from 'bcrypt';

async function bootstrap() {
    // 1. สร้าง Standalone Application Context (ไม่เปิด HTTP Server)
    const app = await NestFactory.createApplicationContext(AppModule);

    // 2. ดึง PrismaService ออกมาจากระบบ Dependency Injection ของ NestJS
    const prisma = app.get(PrismaService);

    console.log('🌱 เริ่มต้นการจำลองข้อมูล (Seeding)...');

    try {
        const hqBranchId = 'branch-hq-001';
        const cnxBranchId = 'branch-cnx-001';
        const salt = await bcrypt.genSalt(10);
        const defaultPassword = await bcrypt.hash('password123', salt);

        // สร้าง Super Admin
        const superAdmin = await prisma.userModel.upsert({
            where: { username: 'superadmin' },
            update: {},
            create: {
                username: 'superadmin123',
                password: defaultPassword,
                role: 'SUPER_ADMIN',
                branchId: hqBranchId,
            },
        });
        console.log(`✅ Created Super Admin: ${superAdmin.username}`);

        // (คุณสามารถนำโค้ดสร้าง User อื่นๆ จากไฟล์เก่ามาใส่ตรงนี้ได้เลย)

        console.log('🎉 Seeding เสร็จสมบูรณ์!');
    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาดในการ Seeding:', error);
    } finally {
        // 3. ปิดแอปพลิเคชันอย่างสมบูรณ์
        await app.close();
        process.exit(0);
    }
}

bootstrap();