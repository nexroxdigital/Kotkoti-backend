/*
  Warnings:

  - The `status` column on the `Friends` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "FriendStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Friends" DROP COLUMN "status",
ADD COLUMN     "status" "FriendStatus" NOT NULL DEFAULT 'PENDING';

-- DropEnum
DROP TYPE "FriendshipStatus";
