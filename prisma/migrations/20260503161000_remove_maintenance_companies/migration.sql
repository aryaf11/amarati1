-- Remove maintenance companies & company applications
ALTER TABLE "VoteOption" DROP CONSTRAINT IF EXISTS "VoteOption_companyId_fkey";
ALTER TABLE "MaintenanceRequest" DROP CONSTRAINT IF EXISTS "MaintenanceRequest_companyId_fkey";

ALTER TABLE "VoteOption" DROP COLUMN IF EXISTS "companyId";
ALTER TABLE "MaintenanceRequest" DROP COLUMN IF EXISTS "companyId";

UPDATE "User" SET "accountKind" = 'RESIDENT' WHERE "accountKind" = 'COMPANY';
UPDATE "Vote" SET "status" = 'CLOSED' WHERE "type" = 'MAINTENANCE_COMPANY' AND "status" = 'OPEN';

DROP TABLE IF EXISTS "CompanyApplication";
DROP TABLE IF EXISTS "MaintenanceCompany";
