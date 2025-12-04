-- DropForeignKey
ALTER TABLE "MomentComment" DROP CONSTRAINT "MomentComment_momentId_fkey";

-- DropForeignKey
ALTER TABLE "MomentLike" DROP CONSTRAINT "MomentLike_momentId_fkey";

-- AddForeignKey
ALTER TABLE "MomentLike" ADD CONSTRAINT "MomentLike_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "Moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MomentComment" ADD CONSTRAINT "MomentComment_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "Moment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
