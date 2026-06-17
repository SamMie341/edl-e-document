/*
  Warnings:

  - You are about to drop the column `branchId` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `divisions` table. All the data in the column will be lost.
  - You are about to drop the column `toBranchId` on the `document_borrows` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `branches` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "addresses" DROP CONSTRAINT "addresses_branchId_fkey";

-- DropForeignKey
ALTER TABLE "divisions" DROP CONSTRAINT "divisions_branchId_fkey";

-- DropForeignKey
ALTER TABLE "document_borrows" DROP CONSTRAINT "document_borrows_toBranchId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_branchId_fkey";

-- AlterTable
ALTER TABLE "addresses" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "divisions" DROP COLUMN "branchId";

-- AlterTable
ALTER TABLE "document_borrows" DROP COLUMN "toBranchId";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "branchId";

-- DropTable
DROP TABLE "branches";
