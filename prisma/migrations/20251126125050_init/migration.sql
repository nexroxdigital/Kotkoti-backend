/*
  Warnings:

  - The primary key for the `Backpack` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `Backpack` table. All the data in the column will be lost.
  - The primary key for the `StoreCategory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `StoreItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Made the column `quantity` on table `Backpack` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Backpack" DROP CONSTRAINT "fk_item";

-- DropForeignKey
ALTER TABLE "Backpack" DROP CONSTRAINT "fk_user";

-- DropForeignKey
ALTER TABLE "StoreItem" DROP CONSTRAINT "StoreItem_categoryId_fkey";

-- DropIndex
DROP INDEX "StoreItem_categoryId_idx";

-- AlterTable
ALTER TABLE "Backpack" DROP CONSTRAINT "Backpack_pkey",
DROP COLUMN "createdAt",
ADD COLUMN     "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "itemId" SET DATA TYPE TEXT,
ALTER COLUMN "quantity" SET NOT NULL,
ADD CONSTRAINT "Backpack_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "StoreCategory" DROP CONSTRAINT "StoreCategory_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "StoreCategory_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "StoreItem" DROP CONSTRAINT "StoreItem_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "categoryId" SET DATA TYPE TEXT,
ALTER COLUMN "validity" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "StoreItem_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "Backpack_userId_idx" ON "Backpack"("userId");

-- CreateIndex
CREATE INDEX "Backpack_itemId_idx" ON "Backpack"("itemId");

-- CreateIndex
CREATE INDEX "CoverPhoto_userId_idx" ON "CoverPhoto"("userId");

-- CreateIndex
CREATE INDEX "CoverPhoto_userId_orderIdx_idx" ON "CoverPhoto"("userId", "orderIdx");

-- AddForeignKey
ALTER TABLE "StoreItem" ADD CONSTRAINT "StoreItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "StoreCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backpack" ADD CONSTRAINT "Backpack_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backpack" ADD CONSTRAINT "Backpack_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "StoreItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
