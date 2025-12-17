/*
  Warnings:

  - You are about to drop the column `type` on the `StoreItem` table. All the data in the column will be lost.
  - The `validity` column on the `StoreItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "StoreItem" DROP COLUMN "type",
DROP COLUMN "validity",
ADD COLUMN     "validity" INTEGER DEFAULT 10;
