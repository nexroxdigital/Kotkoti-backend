-- CreateIndex
CREATE INDEX "Visitors_visitorId_idx" ON "Visitors"("visitorId");

-- AddForeignKey
ALTER TABLE "Visitors" ADD CONSTRAINT "Visitors_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
