-- Revert role from TEXT[] back to TEXT (single role per user)
-- Take the first element of the array as the new single role value

ALTER TABLE "users"
  ALTER COLUMN "role" TYPE TEXT
  USING (COALESCE("role"[1], 'USER'));
