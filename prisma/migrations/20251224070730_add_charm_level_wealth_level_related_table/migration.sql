/*
  Warnings:

  - You are about to drop the column `expiredDate` on the `Level_privileges_Gift` table. All the data in the column will be lost.
  - You are about to drop the column `levelNo` on the `Level_privileges_Gift` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Level_privileges_Gift" DROP COLUMN "expiredDate",
DROP COLUMN "levelNo",
ADD COLUMN     "isPower" BOOLEAN,
ADD COLUMN     "powerName" TEXT;

-- CreateTable
CREATE TABLE "WealthLevelPrivilege" (
    "wealthLevelId" TEXT NOT NULL,
    "privilegeId" INTEGER NOT NULL,

    CONSTRAINT "WealthLevelPrivilege_pkey" PRIMARY KEY ("wealthLevelId","privilegeId")
);

-- CreateTable
CREATE TABLE "CharmLevelPrivilege" (
    "charmLevelId" TEXT NOT NULL,
    "privilegeId" INTEGER NOT NULL,

    CONSTRAINT "CharmLevelPrivilege_pkey" PRIMARY KEY ("charmLevelId","privilegeId")
);

-- CreateIndex
CREATE INDEX "WealthLevelPrivilege_privilegeId_idx" ON "WealthLevelPrivilege"("privilegeId");

-- CreateIndex
CREATE INDEX "CharmLevelPrivilege_privilegeId_idx" ON "CharmLevelPrivilege"("privilegeId");

-- AddForeignKey
ALTER TABLE "WealthLevelPrivilege" ADD CONSTRAINT "WealthLevelPrivilege_wealthLevelId_fkey" FOREIGN KEY ("wealthLevelId") REFERENCES "WealthLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WealthLevelPrivilege" ADD CONSTRAINT "WealthLevelPrivilege_privilegeId_fkey" FOREIGN KEY ("privilegeId") REFERENCES "Level_privileges_Gift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharmLevelPrivilege" ADD CONSTRAINT "CharmLevelPrivilege_charmLevelId_fkey" FOREIGN KEY ("charmLevelId") REFERENCES "CharmLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharmLevelPrivilege" ADD CONSTRAINT "CharmLevelPrivilege_privilegeId_fkey" FOREIGN KEY ("privilegeId") REFERENCES "Level_privileges_Gift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
