/*
  Warnings:

  - You are about to drop the column `isBlocked` on the `Follow` table. All the data in the column will be lost.
  - You are about to drop the column `isMuted` on the `Follow` table. All the data in the column will be lost.
  - You are about to drop the column `deviceId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Follow" DROP COLUMN "isBlocked",
DROP COLUMN "isMuted";

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "country" TEXT,
ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "deviceId",
DROP COLUMN "ipAddress";

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "targetType" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
