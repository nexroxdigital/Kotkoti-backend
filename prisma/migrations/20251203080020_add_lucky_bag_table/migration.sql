-- CreateTable
CREATE TABLE "LuckyPack" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "totalGold" INTEGER NOT NULL,
    "totalClaimers" INTEGER NOT NULL,
    "claimedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LuckyPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LuckyPackClaim" (
    "id" TEXT NOT NULL,
    "luckyPackId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goldClaimed" INTEGER NOT NULL,
    "diamondGot" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LuckyPackClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LuckyPackClaim_luckyPackId_idx" ON "LuckyPackClaim"("luckyPackId");

-- CreateIndex
CREATE INDEX "LuckyPackClaim_userId_idx" ON "LuckyPackClaim"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LuckyPackClaim_luckyPackId_userId_key" ON "LuckyPackClaim"("luckyPackId", "userId");

-- AddForeignKey
ALTER TABLE "LuckyPack" ADD CONSTRAINT "LuckyPack_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LuckyPackClaim" ADD CONSTRAINT "LuckyPackClaim_luckyPackId_fkey" FOREIGN KEY ("luckyPackId") REFERENCES "LuckyPack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LuckyPackClaim" ADD CONSTRAINT "LuckyPackClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
