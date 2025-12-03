/*
  Warnings:

  - Added the required column `maxClaims` to the `LuckyPack` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LuckyPack" ADD COLUMN     "maxClaims" INTEGER NOT NULL;
