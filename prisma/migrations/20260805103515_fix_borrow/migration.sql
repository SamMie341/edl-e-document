/*
  Warnings:

  - You are about to drop the column `documentId` on the `document_borrows` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `document_borrows` table. All the data in the column will be lost.
  - You are about to drop the column `folderId` on the `document_borrows` table. All the data in the column will be lost.
  - You are about to drop the column `returnedAt` on the `document_borrows` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "document_borrows" DROP CONSTRAINT "document_borrows_documentId_fkey";

-- DropForeignKey
ALTER TABLE "document_borrows" DROP CONSTRAINT "document_borrows_folderId_fkey";

-- AlterTable
ALTER TABLE "document_borrows" DROP COLUMN "documentId",
DROP COLUMN "dueDate",
DROP COLUMN "folderId",
DROP COLUMN "returnedAt";

-- CreateTable
CREATE TABLE "document_borrow_items" (
    "id" TEXT NOT NULL,
    "borrowId" TEXT NOT NULL,
    "documentId" TEXT,
    "folderId" TEXT,
    "dueDate" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'BORROWED',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_borrow_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "document_borrow_items" ADD CONSTRAINT "document_borrow_items_borrowId_fkey" FOREIGN KEY ("borrowId") REFERENCES "document_borrows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_borrow_items" ADD CONSTRAINT "document_borrow_items_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_borrow_items" ADD CONSTRAINT "document_borrow_items_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
