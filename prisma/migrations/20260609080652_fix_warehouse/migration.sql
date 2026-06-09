/*
  Warnings:

  - You are about to drop the column `branchId` on the `warehouses` table. All the data in the column will be lost.
  - You are about to drop the column `divisionId` on the `warehouses` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "warehouses" DROP CONSTRAINT "warehouses_branchId_fkey";

-- DropForeignKey
ALTER TABLE "warehouses" DROP CONSTRAINT "warehouses_divisionId_fkey";

-- AlterTable
ALTER TABLE "warehouses" DROP COLUMN "branchId",
DROP COLUMN "divisionId";
