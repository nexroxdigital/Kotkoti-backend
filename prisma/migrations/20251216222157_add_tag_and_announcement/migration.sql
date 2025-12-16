/*
  Warnings:

  - You are about to drop the column `tags` on the `AudioRoom` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AudioRoom" DROP COLUMN "tags",
ADD COLUMN     "announcement" TEXT,
ADD COLUMN     "tag" TEXT;
