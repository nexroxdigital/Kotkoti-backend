/*
  Warnings:

  - You are about to drop the `VoiceRoom` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VoiceRoomBan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VoiceRoomEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VoiceRoomParticipant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VoiceRoomSeat` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VoiceRoomSeatRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VoiceRoomTokenLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('AGORA', 'ZEGO');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DENIED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "VoiceRoom" DROP CONSTRAINT "VoiceRoom_hostId_fkey";

-- DropForeignKey
ALTER TABLE "VoiceRoomBan" DROP CONSTRAINT "VoiceRoomBan_roomId_fkey";

-- DropForeignKey
ALTER TABLE "VoiceRoomEvent" DROP CONSTRAINT "VoiceRoomEvent_roomId_fkey";

-- DropForeignKey
ALTER TABLE "VoiceRoomParticipant" DROP CONSTRAINT "VoiceRoomParticipant_roomId_fkey";

-- DropForeignKey
ALTER TABLE "VoiceRoomSeat" DROP CONSTRAINT "VoiceRoomSeat_roomId_fkey";

-- DropForeignKey
ALTER TABLE "VoiceRoomSeatRequest" DROP CONSTRAINT "VoiceRoomSeatRequest_roomId_fkey";

-- DropForeignKey
ALTER TABLE "VoiceRoomTokenLog" DROP CONSTRAINT "VoiceRoomTokenLog_roomId_fkey";

-- DropTable
DROP TABLE "VoiceRoom";

-- DropTable
DROP TABLE "VoiceRoomBan";

-- DropTable
DROP TABLE "VoiceRoomEvent";

-- DropTable
DROP TABLE "VoiceRoomParticipant";

-- DropTable
DROP TABLE "VoiceRoomSeat";

-- DropTable
DROP TABLE "VoiceRoomSeatRequest";

-- DropTable
DROP TABLE "VoiceRoomTokenLog";

-- CreateTable
CREATE TABLE "AudioRoom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "isLive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "AudioRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seat" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "userId" TEXT,
    "micOn" BOOLEAN NOT NULL DEFAULT true,
    "locked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Seat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomParticipant" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rtcUid" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnectedAt" TIMESTAMP(3),
    "isHost" BOOLEAN NOT NULL DEFAULT false,
    "muted" BOOLEAN NOT NULL DEFAULT false,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeatRequest" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seatIndex" INTEGER,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeatRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioRoomBan" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bannedBy" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AudioRoomBan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderTokenLog" (
    "id" TEXT NOT NULL,
    "roomId" TEXT,
    "userId" TEXT,
    "provider" "Provider" NOT NULL,
    "token" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "meta" JSONB,

    CONSTRAINT "ProviderTokenLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Seat_roomId_index_key" ON "Seat"("roomId", "index");

-- CreateIndex
CREATE INDEX "RoomParticipant_roomId_idx" ON "RoomParticipant"("roomId");

-- CreateIndex
CREATE INDEX "RoomParticipant_userId_idx" ON "RoomParticipant"("userId");

-- CreateIndex
CREATE INDEX "SeatRequest_roomId_idx" ON "SeatRequest"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "AudioRoomBan_roomId_userId_key" ON "AudioRoomBan"("roomId", "userId");

-- AddForeignKey
ALTER TABLE "AudioRoom" ADD CONSTRAINT "AudioRoom_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seat" ADD CONSTRAINT "Seat_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "AudioRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seat" ADD CONSTRAINT "Seat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomParticipant" ADD CONSTRAINT "RoomParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomParticipant" ADD CONSTRAINT "RoomParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "AudioRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatRequest" ADD CONSTRAINT "SeatRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeatRequest" ADD CONSTRAINT "SeatRequest_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "AudioRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioRoomBan" ADD CONSTRAINT "AudioRoomBan_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "AudioRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioRoomBan" ADD CONSTRAINT "AudioRoomBan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioRoomBan" ADD CONSTRAINT "AudioRoomBan_bannedBy_fkey" FOREIGN KEY ("bannedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderTokenLog" ADD CONSTRAINT "ProviderTokenLog_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "AudioRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
