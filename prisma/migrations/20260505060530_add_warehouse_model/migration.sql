-- AlterTable
ALTER TABLE "lockers" ADD COLUMN     "warehouseId" TEXT;

-- CreateTable
CREATE TABLE "WarehouseModel" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'A',
    "branchId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseModel_code_key" ON "WarehouseModel"("code");

-- AddForeignKey
ALTER TABLE "lockers" ADD CONSTRAINT "lockers_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "WarehouseModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseModel" ADD CONSTRAINT "WarehouseModel_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
