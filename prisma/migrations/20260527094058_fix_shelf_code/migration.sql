/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `shelves` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "shelves_code_key" ON "shelves"("code");
