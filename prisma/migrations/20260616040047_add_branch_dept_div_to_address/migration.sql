-- AlterTable
ALTER TABLE "addresses" ADD COLUMN     "branchId" INTEGER,
ADD COLUMN     "departmentId" INTEGER,
ADD COLUMN     "divisionId" INTEGER;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
