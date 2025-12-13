-- CreateIndex
CREATE INDEX "Agency_ownerId_idx" ON "Agency"("ownerId");

-- CreateIndex
CREATE INDEX "Agency_status_idx" ON "Agency"("status");

-- CreateIndex
CREATE INDEX "AudioRoom_hostId_idx" ON "AudioRoom"("hostId");

-- CreateIndex
CREATE INDEX "AudioRoom_isLive_idx" ON "AudioRoom"("isLive");

-- CreateIndex
CREATE INDEX "AudioRoom_createdAt_idx" ON "AudioRoom"("createdAt");

-- CreateIndex
CREATE INDEX "GiftTransaction_senderId_idx" ON "GiftTransaction"("senderId");

-- CreateIndex
CREATE INDEX "GiftTransaction_receiverId_idx" ON "GiftTransaction"("receiverId");

-- CreateIndex
CREATE INDEX "GiftTransaction_streamId_idx" ON "GiftTransaction"("streamId");

-- CreateIndex
CREATE INDEX "GiftTransaction_createdAt_idx" ON "GiftTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "LoginHistory_userId_idx" ON "LoginHistory"("userId");

-- CreateIndex
CREATE INDEX "LoginHistory_createdAt_idx" ON "LoginHistory"("createdAt");

-- CreateIndex
CREATE INDEX "LuckyPack_creatorId_idx" ON "LuckyPack"("creatorId");

-- CreateIndex
CREATE INDEX "LuckyPack_roomId_idx" ON "LuckyPack"("roomId");

-- CreateIndex
CREATE INDEX "LuckyPack_createdAt_idx" ON "LuckyPack"("createdAt");

-- CreateIndex
CREATE INDEX "Moment_userId_idx" ON "Moment"("userId");

-- CreateIndex
CREATE INDEX "Moment_createdAt_idx" ON "Moment"("createdAt");

-- CreateIndex
CREATE INDEX "RechargeLog_userId_idx" ON "RechargeLog"("userId");

-- CreateIndex
CREATE INDEX "RechargeLog_sellerId_idx" ON "RechargeLog"("sellerId");

-- CreateIndex
CREATE INDEX "RechargeLog_createdAt_idx" ON "RechargeLog"("createdAt");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "User_agencyId_idx" ON "User"("agencyId");

-- CreateIndex
CREATE INDEX "User_vipId_idx" ON "User"("vipId");

-- CreateIndex
CREATE INDEX "User_activeItemId_idx" ON "User"("activeItemId");

-- CreateIndex
CREATE INDEX "User_charmLevelId_idx" ON "User"("charmLevelId");

-- CreateIndex
CREATE INDEX "User_wealthLevelId_idx" ON "User"("wealthLevelId");

-- CreateIndex
CREATE INDEX "User_isHost_idx" ON "User"("isHost");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Vip_type_idx" ON "Vip"("type");

-- CreateIndex
CREATE INDEX "Vip_expiryDate_idx" ON "Vip"("expiryDate");
