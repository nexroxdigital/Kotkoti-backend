/*
  Warnings:

  - You are about to drop the column `powerName` on the `CharmLevelPrivilege` table. All the data in the column will be lost.
  - You are about to drop the column `powerName` on the `WealthLevelPrivilege` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CharmLevelPrivilege" DROP COLUMN "powerName",
ADD COLUMN     "canCreateFamily" BOOLEAN DEFAULT false,
ADD COLUMN     "roomAdminLimit" INTEGER DEFAULT 0,
ALTER COLUMN "isPower" SET DEFAULT false;

-- AlterTable
ALTER TABLE "WealthLevelPrivilege" DROP COLUMN "powerName",
ADD COLUMN     "canCreateFamily" BOOLEAN DEFAULT false,
ADD COLUMN     "roomAdminLimit" INTEGER DEFAULT 0,
ALTER COLUMN "isPower" SET DEFAULT false;
