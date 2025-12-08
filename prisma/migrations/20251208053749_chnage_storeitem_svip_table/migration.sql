/*
  Warnings:

  - You are about to drop the column `swftime` on the `SvipMediaPrivilege` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "StoreItem" ADD COLUMN     "swf" TEXT,
ADD COLUMN     "swftime" INTEGER;

-- AlterTable
ALTER TABLE "Svip" ADD COLUMN     "swf" TEXT,
ADD COLUMN     "swfTime" INTEGER;

-- AlterTable
ALTER TABLE "SvipMediaPrivilege" DROP COLUMN "swftime",
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "swfTime" INTEGER;

-- AlterTable
ALTER TABLE "SvipPowerPrivilege" ADD COLUMN     "icon" TEXT,
ADD COLUMN     "swf" TEXT,
ADD COLUMN     "swftime" INTEGER;
