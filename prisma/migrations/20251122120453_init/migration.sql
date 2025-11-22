/*
  Warnings:

  - You are about to drop the column `nickName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `User` table. All the data in the column will be lost.
  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "nickName",
DROP COLUMN "roleId",
ADD COLUMN     "activeProps" TEXT,
ADD COLUMN     "agencyId" TEXT,
ADD COLUMN     "charmLevel" TEXT,
ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "diamond" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gold" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "isAccountBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDiamondBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isGoldBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isHost" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isReseller" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Unknown',
ADD COLUMN     "role" TEXT,
ADD COLUMN     "vipId" TEXT,
ADD COLUMN     "wealthLevel" TEXT,
ALTER COLUMN "password" SET NOT NULL;
