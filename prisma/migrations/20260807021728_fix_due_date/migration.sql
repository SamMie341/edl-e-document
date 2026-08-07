/*
  Warnings:

  - You are about to drop the column `dueDate` on the `document_borrow_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "document_borrow_items" DROP COLUMN "dueDate";

-- AlterTable
ALTER TABLE "document_borrows" ADD COLUMN     "dueDate" TIMESTAMP(3);
