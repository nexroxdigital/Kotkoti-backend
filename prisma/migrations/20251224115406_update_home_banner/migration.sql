-- AlterTable
ALTER TABLE "HomeBanner" ADD COLUMN     "country" TEXT,
ADD COLUMN     "isGlobal" BOOLEAN NOT NULL DEFAULT false;
