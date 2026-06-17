-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "departmentId" INTEGER,
ADD COLUMN     "divisionId" INTEGER;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
