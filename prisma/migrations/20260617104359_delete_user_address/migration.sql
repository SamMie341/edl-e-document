/*
  Warnings:

  - You are about to drop the column `addressId` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_addressId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "addressId",
ALTER COLUMN "role" DROP DEFAULT;
