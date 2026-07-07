import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 ກຳລັງເລີ່ມສ້າງບັນຊີ Super Admin...');

  // 🌟 ตั้งรหัสผ่านตั้งต้น (เปลี่ยนได้ตามต้องการ)
  const defaultPassword = 'EDL1234';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(defaultPassword, salt);

  // 🌟 ใช้คำสั่ง upsert เพื่อป้องกัน Error กรณีที่กด Seed ซ้ำ
  const superAdmin = await prisma.userModel.upsert({
    where: { email: 'superadmin@edl.com.la' }, // เช็คว่ามี username นี้หรือยัง
    update: {}, // ถ้ามีแล้ว ไม่ต้องทำอะไร
    create: {
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      empCode: 'ADMIN000',
      empId: 0,
      firstNameLa: 'ຜູ້ເບິ່ງແຍງລະບົບ',
      lastNameLa: 'ສູງສຸດ',
      firstNameEng: 'Super',
      lastNameEng: 'Admin',
      email: 'superadmin@edl.com.la',
      status: 'A', // ถ้าใน Schema มีสถานะ (A = Active)
    },
  });

  console.log(`✅ ສ້າງ Super Admin ສຳເລັດແລ້ວ!`);
  console.log(`👤 Username: ${superAdmin.email}`);
  console.log(`🔑 Password: ${defaultPassword}`);
}

main()
  .catch((e) => {
    console.error('❌ ເກີດຂໍ້ຜິດພາດໃນການ Seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });