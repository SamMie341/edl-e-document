/*
  Warnings:

  - You are about to drop the column `branchId` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `divisionId` on the `addresses` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "addresses" DROP CONSTRAINT "addresses_branchId_fkey";

-- DropForeignKey
ALTER TABLE "addresses" DROP CONSTRAINT "addresses_divisionId_fkey";

-- AlterTable
ALTER TABLE "addresses" DROP COLUMN "branchId",
DROP COLUMN "divisionId";
