/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Level_privileges_Gift` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Level_privileges_Gift` table. All the data in the column will be lost.
  - You are about to drop the column `swf` on the `Level_privileges_Gift` table. All the data in the column will be lost.
  - You are about to drop the column `swfTime` on the `Level_privileges_Gift` table. All the data in the column will be lost.
  - You are about to drop the `Category_Level_privileges` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Level_privileges_Gift" DROP CONSTRAINT "Level_privileges_Gift_categoryId_fkey";

-- AlterTable
ALTER TABLE "Level_privileges_Gift" DROP COLUMN "categoryId",
DROP COLUMN "image",
DROP COLUMN "swf",
DROP COLUMN "swfTime",
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'N/A',
ADD COLUMN     "storeItemsId" TEXT;

-- DropTable
DROP TABLE "Category_Level_privileges";

-- AddForeignKey
ALTER TABLE "Level_privileges_Gift" ADD CONSTRAINT "Level_privileges_Gift_storeItemsId_fkey" FOREIGN KEY ("storeItemsId") REFERENCES "StoreItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
