-- DropForeignKey
ALTER TABLE "warehouses" DROP CONSTRAINT "warehouses_addressId_fkey";

-- DropForeignKey
ALTER TABLE "addresses" DROP CONSTRAINT IF EXISTS "addresses_departmentId_fkey";
ALTER TABLE "addresses" DROP CONSTRAINT IF EXISTS "addresses_divisionId_fkey";

-- AlterTable
ALTER TABLE "warehouses" DROP COLUMN "addressId",
ADD COLUMN "departmentId" INTEGER,
ADD COLUMN "divisionId" INTEGER;

-- DropTable
DROP TABLE IF EXISTS "addresses";

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
