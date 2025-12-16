-- DropIndex
DROP INDEX "AudioRoom_hostId_idx";

-- DropIndex
DROP INDEX "AudioRoom_isLive_idx";

-- DropIndex
DROP INDEX "RoomParticipant_roomId_userId_key";

-- DropIndex
DROP INDEX "RoomParticipant_userId_idx";

-- CreateIndex
CREATE INDEX "AudioRoom_hostId_isLive_idx" ON "AudioRoom"("hostId", "isLive");

-- CreateIndex
CREATE INDEX "RoomParticipant_roomId_disconnectedAt_idx" ON "RoomParticipant"("roomId", "disconnectedAt");

-- CreateIndex
CREATE INDEX "Seat_roomId_index_idx" ON "Seat"("roomId", "index");

-- CreateIndex
CREATE INDEX "Seat_roomId_micOn_idx" ON "Seat"("roomId", "micOn");

-- CreateIndex
CREATE INDEX "Seat_roomId_mode_idx" ON "Seat"("roomId", "mode");
