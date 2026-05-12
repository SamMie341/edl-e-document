/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `shelves` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `shelves` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "shelves" ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "shelves_code_key" ON "shelves"("code");
