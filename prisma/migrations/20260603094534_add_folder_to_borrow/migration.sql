-- DropForeignKey
ALTER TABLE "document_borrows" DROP CONSTRAINT "document_borrows_documentId_fkey";

-- AlterTable
ALTER TABLE "document_borrows" ADD COLUMN     "folderId" TEXT,
ALTER COLUMN "documentId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "document_borrows" ADD CONSTRAINT "document_borrows_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_borrows" ADD CONSTRAINT "document_borrows_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
