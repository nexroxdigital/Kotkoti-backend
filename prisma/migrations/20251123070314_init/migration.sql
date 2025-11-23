-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Follow_userId_idx" ON "Follow"("userId");

-- CreateIndex
CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_userId_followerId_key" ON "Follow"("userId", "followerId");

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
