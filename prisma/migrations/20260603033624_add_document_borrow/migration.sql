/*
  Warnings:

  - You are about to drop the column `status` on the `documents` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "documents_docNo_key";

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "status",
ADD COLUMN     "isContractBound" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shortName" TEXT,
ALTER COLUMN "description" DROP NOT NULL;

-- CreateTable
CREATE TABLE "document_borrows" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "borrowerId" TEXT NOT NULL,
    "borrowedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),
    "purpose" TEXT,
    "toBranchId" INTEGER,
    "toDivisionId" INTEGER,
    "toLocation" TEXT,
    "createdById" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_borrows_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "document_borrows" ADD CONSTRAINT "document_borrows_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_borrows" ADD CONSTRAINT "document_borrows_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_borrows" ADD CONSTRAINT "document_borrows_toBranchId_fkey" FOREIGN KEY ("toBranchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_borrows" ADD CONSTRAINT "document_borrows_toDivisionId_fkey" FOREIGN KEY ("toDivisionId") REFERENCES "divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_borrows" ADD CONSTRAINT "document_borrows_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
