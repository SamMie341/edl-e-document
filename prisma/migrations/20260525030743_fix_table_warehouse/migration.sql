-- AlterTable
ALTER TABLE "warehouses" ADD COLUMN     "divisionId" INTEGER;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
