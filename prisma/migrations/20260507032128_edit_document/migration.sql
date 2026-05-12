/*
  Warnings:

  - You are about to drop the column `isActive` on the `document_types` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "document_types_name_key";

-- AlterTable
ALTER TABLE "document_types" DROP COLUMN "isActive";
