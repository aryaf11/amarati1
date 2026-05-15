-- إزالة الإحداثيات من المبنى + حقول اختيار شركة الصيانة (انظر schema.prisma → Building / MaintenanceRequest).
ALTER TABLE "Building" DROP COLUMN IF EXISTS "latitude";
ALTER TABLE "Building" DROP COLUMN IF EXISTS "longitude";
ALTER TABLE "MaintenanceRequest" ADD COLUMN "selectedVendor" TEXT;
ALTER TABLE "MaintenanceRequest" ADD COLUMN "aiCompaniesJson" TEXT;
