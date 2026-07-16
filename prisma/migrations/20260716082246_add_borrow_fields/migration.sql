-- AlterTable
ALTER TABLE "document_borrows" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'BORROWED';
