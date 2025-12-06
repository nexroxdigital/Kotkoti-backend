/*
  Warnings:

  - You are about to drop the column `locked` on the `Seat` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SeatMode" AS ENUM ('FREE', 'REQUEST', 'LOCKED');

-- AlterTable
ALTER TABLE "Seat" DROP COLUMN "locked",
ADD COLUMN     "mode" "SeatMode" NOT NULL DEFAULT 'REQUEST';
