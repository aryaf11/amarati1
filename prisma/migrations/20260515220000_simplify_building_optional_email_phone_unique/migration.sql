-- Normalize phone before constraints
UPDATE "User"
SET "phone" = 'legacy-' || "id"
WHERE "phone" IS NULL OR trim(COALESCE("phone", '')) = '';

-- Optional email (multiple NULLs allowed with UNIQUE in PostgreSQL)
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

ALTER TABLE "User" ALTER COLUMN "phone" SET NOT NULL;

ALTER TABLE "User" DROP COLUMN IF EXISTS "avatarUrl";

CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User" ("phone");

ALTER TABLE "Building" DROP COLUMN IF EXISTS "region";
ALTER TABLE "Building" DROP COLUMN IF EXISTS "district";
ALTER TABLE "Building" DROP COLUMN IF EXISTS "streetName";
ALTER TABLE "Building" DROP COLUMN IF EXISTS "buildingNumber";
ALTER TABLE "Building" DROP COLUMN IF EXISTS "additionalNumber";
ALTER TABLE "Building" DROP COLUMN IF EXISTS "postalCode";
ALTER TABLE "Building" DROP COLUMN IF EXISTS "shortAddressCode";
