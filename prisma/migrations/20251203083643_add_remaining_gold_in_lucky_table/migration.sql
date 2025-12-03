/*
  Warnings:

  - Added the required column `remainingGold` to the `LuckyPack` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LuckyPack" ADD COLUMN     "remainingGold" INTEGER NOT NULL;
