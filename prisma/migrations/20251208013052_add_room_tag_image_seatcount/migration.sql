-- AlterTable
ALTER TABLE "AudioRoom" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "seatCount" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "tag" TEXT;
