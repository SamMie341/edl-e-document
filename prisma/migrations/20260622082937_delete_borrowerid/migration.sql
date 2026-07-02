/*
  Warnings:

  - You are about to drop the column `borrowerId` on the `document_borrows` table. All the data in the column will be lost.
  - Added the required column `borrower` to the `document_borrows` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "document_borrows" DROP CONSTRAINT "document_borrows_borrowerId_fkey";

-- AlterTable
ALTER TABLE "document_borrows" DROP COLUMN "borrowerId",
ADD COLUMN     "borrower" TEXT NOT NULL;
