/*
  Warnings:

  - Added the required column `levelNo` to the `CharmLevel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `levelNo` to the `WealthLevel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CharmLevel" ADD COLUMN     "levelNo" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "charmPoint" INTEGER,
ADD COLUMN     "wealthPoint" INTEGER;

-- AlterTable
ALTER TABLE "WealthLevel" ADD COLUMN     "levelNo" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Category_Level_privileges" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_Level_privileges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Level_privileges_Gift" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "expiredDate" TIMESTAMP(3),
    "image" TEXT NOT NULL,
    "swf" TEXT NOT NULL,
    "swfTime" TEXT,
    "isCharm" BOOLEAN,
    "isWealth" BOOLEAN,
    "levelNo" INTEGER,

    CONSTRAINT "Level_privileges_Gift_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Level_privileges_Gift" ADD CONSTRAINT "Level_privileges_Gift_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category_Level_privileges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
