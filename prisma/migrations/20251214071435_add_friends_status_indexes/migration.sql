-- CreateIndex
CREATE INDEX "Friends_status_idx" ON "Friends"("status");

-- CreateIndex
CREATE INDEX "Friends_requesterId_status_idx" ON "Friends"("requesterId", "status");

-- CreateIndex
CREATE INDEX "Friends_receiverId_status_idx" ON "Friends"("receiverId", "status");
