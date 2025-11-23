/*
  Warnings:

  - You are about to drop the column `activePropsId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `charmLevel` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `wealthLevel` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `ActiveProps` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Friendship` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_requesterId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "user_activeProps_fk";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "activePropsId",
DROP COLUMN "charmLevel",
DROP COLUMN "wealthLevel",
ADD COLUMN     "charmLevelId" TEXT,
ADD COLUMN     "wealthLevelId" TEXT;

-- DropTable
DROP TABLE "ActiveProps";

-- DropTable
DROP TABLE "Friendship";

-- CreateTable
CREATE TABLE "LoginHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ip" TEXT,
    "country" TEXT,
    "deviceId" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharmLevel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "levelup_point" INTEGER NOT NULL,

    CONSTRAINT "CharmLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WealthLevel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "levelup_point" INTEGER NOT NULL,

    CONSTRAINT "WealthLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friends" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Friends_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Friends_requesterId_idx" ON "Friends"("requesterId");

-- CreateIndex
CREATE INDEX "Friends_receiverId_idx" ON "Friends"("receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "Friends_requesterId_receiverId_key" ON "Friends"("requesterId", "receiverId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_charmLevelId_fkey" FOREIGN KEY ("charmLevelId") REFERENCES "CharmLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_wealthLevelId_fkey" FOREIGN KEY ("wealthLevelId") REFERENCES "WealthLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friends" ADD CONSTRAINT "Friends_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friends" ADD CONSTRAINT "Friends_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
