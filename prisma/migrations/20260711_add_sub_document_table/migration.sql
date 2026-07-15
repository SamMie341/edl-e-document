-- Migration: add_sub_document_table
-- Migrate existing subDocNo/subDocDate data before dropping columns

-- Step 1: Create sub_documents table
CREATE TABLE "sub_documents" (
    "id" TEXT NOT NULL,
    "subDocNo" TEXT NOT NULL,
    "subDocDate" TIMESTAMP(3) NOT NULL,
    "subDocTitle" TEXT NOT NULL DEFAULT '',
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sub_documents_pkey" PRIMARY KEY ("id")
);

-- Step 2: Add unique constraint
CREATE UNIQUE INDEX "sub_documents_documentId_subDocNo_key" ON "sub_documents"("documentId", "subDocNo");

-- Step 3: Add foreign key constraint with CASCADE DELETE
ALTER TABLE "sub_documents" ADD CONSTRAINT "sub_documents_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 4: Migrate existing data from documents to sub_documents
INSERT INTO "sub_documents" ("id", "subDocNo", "subDocDate", "subDocTitle", "documentId", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    "subDocNo",
    "subDocDate",
    '',
    "id",
    NOW(),
    NOW()
FROM "documents"
WHERE "subDocNo" IS NOT NULL AND "subDocDate" IS NOT NULL;

-- Step 5: Drop old columns from documents table
ALTER TABLE "documents" DROP COLUMN "subDocNo";
ALTER TABLE "documents" DROP COLUMN "subDocDate";
