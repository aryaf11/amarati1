-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "phoneOtpCode" TEXT;
ALTER TABLE "User" ADD COLUMN "phoneOtpExpires" TIMESTAMP(3);
