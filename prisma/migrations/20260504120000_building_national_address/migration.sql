-- AlterTable
ALTER TABLE "Building" ADD COLUMN     "region" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "streetName" TEXT,
ADD COLUMN     "buildingNumber" TEXT,
ADD COLUMN     "additionalNumber" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "shortAddressCode" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;
