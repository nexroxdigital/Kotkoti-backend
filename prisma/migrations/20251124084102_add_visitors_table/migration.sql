-- CreateTable
CREATE TABLE "Visitors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visitors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Visitors_userId_idx" ON "Visitors"("userId");

-- AddForeignKey
ALTER TABLE "Visitors" ADD CONSTRAINT "Visitors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
