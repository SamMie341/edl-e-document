/*
  Warnings:

  - A unique constraint covering the columns `[shelfId,code]` on the table `folders` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "folders_code_key";

-- AlterTable
ALTER TABLE "sub_documents" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "folders_shelfId_code_key" ON "folders"("shelfId", "code");
