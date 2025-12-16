/*
  Warnings:

  - A unique constraint covering the columns `[roomId,userId]` on the table `RoomParticipant` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RoomParticipant_roomId_userId_key" ON "RoomParticipant"("roomId", "userId");
