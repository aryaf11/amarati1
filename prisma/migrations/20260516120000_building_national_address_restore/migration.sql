-- العنوان الوطني السعودي (حقول اختيارية للمبانى الحالية)
ALTER TABLE "Building" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "Building" ADD COLUMN IF NOT EXISTS "district" TEXT;
ALTER TABLE "Building" ADD COLUMN IF NOT EXISTS "streetName" TEXT;
ALTER TABLE "Building" ADD COLUMN IF NOT EXISTS "buildingNumber" TEXT;
ALTER TABLE "Building" ADD COLUMN IF NOT EXISTS "additionalNumber" TEXT;
ALTER TABLE "Building" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;
ALTER TABLE "Building" ADD COLUMN IF NOT EXISTS "shortAddressCode" TEXT;
