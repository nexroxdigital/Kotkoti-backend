/*
  Warnings:

  - The primary key for the `CharmLevelPrivilege` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `privilegeId` on the `CharmLevelPrivilege` table. All the data in the column will be lost.
  - The primary key for the `WealthLevelPrivilege` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `privilegeId` on the `WealthLevelPrivilege` table. All the data in the column will be lost.
  - You are about to drop the `Level_privileges_Gift` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CharmLevelPrivilege" DROP CONSTRAINT "CharmLevelPrivilege_privilegeId_fkey";

-- DropForeignKey
ALTER TABLE "Level_privileges_Gift" DROP CONSTRAINT "Level_privileges_Gift_storeItemsId_fkey";

-- DropForeignKey
ALTER TABLE "WealthLevelPrivilege" DROP CONSTRAINT "WealthLevelPrivilege_privilegeId_fkey";

-- DropIndex
DROP INDEX "CharmLevelPrivilege_privilegeId_idx";

-- DropIndex
DROP INDEX "WealthLevelPrivilege_privilegeId_idx";

-- AlterTable
ALTER TABLE "CharmLevelPrivilege" DROP CONSTRAINT "CharmLevelPrivilege_pkey",
DROP COLUMN "privilegeId",
ADD COLUMN     "isPower" BOOLEAN,
ADD COLUMN     "powerName" TEXT,
ADD COLUMN     "storeItemsId" TEXT,
ADD CONSTRAINT "CharmLevelPrivilege_pkey" PRIMARY KEY ("charmLevelId");

-- AlterTable
ALTER TABLE "StoreItem" ADD COLUMN     "isPrivilege" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "WealthLevelPrivilege" DROP CONSTRAINT "WealthLevelPrivilege_pkey",
DROP COLUMN "privilegeId",
ADD COLUMN     "isPower" BOOLEAN,
ADD COLUMN     "powerName" TEXT,
ADD COLUMN     "storeItemsId" TEXT,
ADD CONSTRAINT "WealthLevelPrivilege_pkey" PRIMARY KEY ("wealthLevelId");

-- DropTable
DROP TABLE "Level_privileges_Gift";

-- AddForeignKey
ALTER TABLE "WealthLevelPrivilege" ADD CONSTRAINT "WealthLevelPrivilege_storeItemsId_fkey" FOREIGN KEY ("storeItemsId") REFERENCES "StoreItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharmLevelPrivilege" ADD CONSTRAINT "CharmLevelPrivilege_storeItemsId_fkey" FOREIGN KEY ("storeItemsId") REFERENCES "StoreItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
