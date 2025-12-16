-- CreateEnum
CREATE TYPE "ChatMode" AS ENUM ('ALL', 'SEAT_ONLY', 'LOCKED');

-- AlterTable
ALTER TABLE "AudioRoom" ADD COLUMN     "chatMode" "ChatMode" NOT NULL DEFAULT 'ALL';
