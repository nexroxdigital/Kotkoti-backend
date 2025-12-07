-- CreateTable
CREATE TABLE "AudioRoomKick" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bannedBy" TEXT NOT NULL,
    "reason" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AudioRoomKick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AudioRoomKick_roomId_userId_key" ON "AudioRoomKick"("roomId", "userId");

-- AddForeignKey
ALTER TABLE "AudioRoomKick" ADD CONSTRAINT "AudioRoomKick_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "AudioRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioRoomKick" ADD CONSTRAINT "AudioRoomKick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
