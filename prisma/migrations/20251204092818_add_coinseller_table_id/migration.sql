/*
  Warnings:

  - The primary key for the `CoinSeller` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `CoinSeller` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `CoinsBuyingHistory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `CoinsBuyingHistory` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `CoinsSellingHistory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `CoinsSellingHistory` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `sellerId` on the `CoinsBuyingHistory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `sellerId` on the `CoinsSellingHistory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "CoinsBuyingHistory" DROP CONSTRAINT "CoinsBuyingHistory_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "CoinsSellingHistory" DROP CONSTRAINT "CoinsSellingHistory_sellerId_fkey";

-- AlterTable
ALTER TABLE "CoinSeller" DROP CONSTRAINT "CoinSeller_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "CoinSeller_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "CoinsBuyingHistory" DROP CONSTRAINT "CoinsBuyingHistory_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "sellerId",
ADD COLUMN     "sellerId" INTEGER NOT NULL,
ADD CONSTRAINT "CoinsBuyingHistory_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "CoinsSellingHistory" DROP CONSTRAINT "CoinsSellingHistory_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "sellerId",
ADD COLUMN     "sellerId" INTEGER NOT NULL,
ADD CONSTRAINT "CoinsSellingHistory_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "CoinsSellingHistory" ADD CONSTRAINT "CoinsSellingHistory_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "CoinSeller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoinsBuyingHistory" ADD CONSTRAINT "CoinsBuyingHistory_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "CoinSeller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
