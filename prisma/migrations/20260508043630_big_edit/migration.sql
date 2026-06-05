/*
  Warnings:

  - You are about to drop the column `branchId` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `contentName` on the `folders` table. All the data in the column will be lost.
  - You are about to drop the column `folderCode` on the `folders` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `lockers` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `lockers` table. All the data in the column will be lost.
  - You are about to drop the `WarehouseModel` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `document_types` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[docNo]` on the table `documents` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `folders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `document_types` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `docDate` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `docExpire` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `docNo` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qrCode` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `folders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `folders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qrCode` to the `folders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxQty` to the `shelves` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "WarehouseModel" DROP CONSTRAINT "WarehouseModel_branchId_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_branchId_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "lockers" DROP CONSTRAINT "lockers_branchId_fkey";

-- DropForeignKey
ALTER TABLE "lockers" DROP CONSTRAINT "lockers_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "lockers" DROP CONSTRAINT "lockers_warehouseId_fkey";

-- DropIndex
DROP INDEX "folders_folderCode_key";

-- AlterTable
ALTER TABLE "document_types" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "branchId",
DROP COLUMN "content",
DROP COLUMN "departmentId",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "docDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "docExpire" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "docNo" TEXT NOT NULL,
ADD COLUMN     "qrCode" TEXT NOT NULL,
ADD COLUMN     "subDocDate" TIMESTAMP(3),
ADD COLUMN     "subDocNo" TEXT;

-- AlterTable
ALTER TABLE "folders" DROP COLUMN "contentName",
DROP COLUMN "folderCode",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "qrCode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "lockers" DROP COLUMN "branchId",
DROP COLUMN "departmentId";

-- AlterTable
ALTER TABLE "shelves" ADD COLUMN     "maxQty" INTEGER NOT NULL;

-- DropTable
DROP TABLE "WarehouseModel";

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'A',
    "branchId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_name_key" ON "document_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "documents_docNo_key" ON "documents"("docNo");

-- CreateIndex
CREATE UNIQUE INDEX "folders_code_key" ON "folders"("code");

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lockers" ADD CONSTRAINT "lockers_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
