-- CreateTable
CREATE TABLE "RechargeLog" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RechargeLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RechargeLog" ADD CONSTRAINT "RechargeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RechargeLog" ADD CONSTRAINT "RechargeLog_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "CoinSeller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
