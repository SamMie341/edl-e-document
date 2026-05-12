/*
  Warnings:

  - You are about to drop the column `departmentId` on the `warehouses` table. All the data in the column will be lost.
  - You are about to drop the column `divisionId` on the `warehouses` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "warehouses" DROP CONSTRAINT "warehouses_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "warehouses" DROP CONSTRAINT "warehouses_divisionId_fkey";

-- AlterTable
ALTER TABLE "warehouses" DROP COLUMN "departmentId",
DROP COLUMN "divisionId";
