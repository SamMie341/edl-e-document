/*
  Warnings:

  - A unique constraint covering the columns `[warehouseId,code]` on the table `lockers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "departmentId" INTEGER,
ADD COLUMN     "divisionId" INTEGER,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "method" TEXT,
ADD COLUMN     "newValue" JSONB,
ADD COLUMN     "oldValue" JSONB,
ADD COLUMN     "path" TEXT,
ADD COLUMN     "payload" JSONB,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "userAgent" TEXT,
ALTER COLUMN "entityId" DROP NOT NULL,
ALTER COLUMN "entityType" DROP NOT NULL,
ALTER COLUMN "actorId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_departmentId_idx" ON "audit_logs"("departmentId");

-- CreateIndex
CREATE INDEX "audit_logs_divisionId_idx" ON "audit_logs"("divisionId");

-- CreateIndex
CREATE UNIQUE INDEX "lockers_warehouseId_code_key" ON "lockers"("warehouseId", "code");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
