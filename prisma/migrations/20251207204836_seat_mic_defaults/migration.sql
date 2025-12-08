-- AlterTable
ALTER TABLE "RoomParticipant" ALTER COLUMN "muted" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Seat" ALTER COLUMN "micOn" SET DEFAULT true,
ALTER COLUMN "mode" SET DEFAULT 'FREE';
