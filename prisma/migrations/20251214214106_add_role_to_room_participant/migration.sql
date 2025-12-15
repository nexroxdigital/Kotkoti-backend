-- CreateEnum
CREATE TYPE "RoomRole" AS ENUM ('HOST', 'ADMIN', 'USER');

-- AlterTable
ALTER TABLE "RoomParticipant" ADD COLUMN     "role" "RoomRole" NOT NULL DEFAULT 'USER';
