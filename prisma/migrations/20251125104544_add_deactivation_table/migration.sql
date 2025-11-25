-- CreateTable
CREATE TABLE "UserDeactivation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT,
    "feedback" TEXT,
    "deactivatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reactivatedAt" TIMESTAMP(3),

    CONSTRAINT "UserDeactivation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserDeactivation_userId_key" ON "UserDeactivation"("userId");

-- CreateIndex
CREATE INDEX "UserDeactivation_userId_idx" ON "UserDeactivation"("userId");

-- AddForeignKey
ALTER TABLE "UserDeactivation" ADD CONSTRAINT "UserDeactivation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
