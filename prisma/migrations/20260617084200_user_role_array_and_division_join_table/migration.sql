-- Custom migration: user-role-array-and-division-join-table
-- Data migration: preserve existing divisionId data before dropping the column

-- Step 1: Create the new user_divisions table
CREATE TABLE "user_divisions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "divisionId" INTEGER NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_divisions_pkey" PRIMARY KEY ("id")
);

-- Step 2: Migrate existing divisionId data from users table to user_divisions
INSERT INTO "user_divisions" ("id", "userId", "divisionId", "isPrimary", "createdAt")
SELECT
    gen_random_uuid()::text,
    id,
    "divisionId",
    true,
    NOW()
FROM "users"
WHERE "divisionId" IS NOT NULL;

-- Step 3: Convert role column from TEXT to TEXT[]
ALTER TABLE "users"
    DROP COLUMN "role",
    ADD COLUMN "role" TEXT[] NOT NULL DEFAULT ARRAY['USER']::TEXT[];

-- Step 4: Drop the divisionId foreign key and column from users
ALTER TABLE "users" DROP CONSTRAINT "users_divisionId_fkey";
ALTER TABLE "users" DROP COLUMN "divisionId";

-- Step 5: Add indexes and foreign keys for user_divisions
CREATE UNIQUE INDEX "user_divisions_userId_divisionId_key" ON "user_divisions"("userId", "divisionId");

ALTER TABLE "user_divisions" ADD CONSTRAINT "user_divisions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_divisions" ADD CONSTRAINT "user_divisions_divisionId_fkey"
    FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
