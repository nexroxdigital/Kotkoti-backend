-- Add performance indexes to improve query speed

-- User table indexes
CREATE INDEX IF NOT EXISTS "User_agencyId_idx" ON "User"("agencyId");
CREATE INDEX IF NOT EXISTS "User_vipId_idx" ON "User"("vipId");
CREATE INDEX IF NOT EXISTS "User_activeItemId_idx" ON "User"("activeItemId");
CREATE INDEX IF NOT EXISTS "User_charmLevelId_idx" ON "User"("charmLevelId");
CREATE INDEX IF NOT EXISTS "User_wealthLevelId_idx" ON "User"("wealthLevelId");
CREATE INDEX IF NOT EXISTS "User_isHost_idx" ON "User"("isHost");
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- LoginHistory indexes
CREATE INDEX IF NOT EXISTS "LoginHistory_userId_idx" ON "LoginHistory"("userId");
CREATE INDEX IF NOT EXISTS "LoginHistory_createdAt_idx" ON "LoginHistory"("createdAt");

-- RefreshToken indexes
CREATE INDEX IF NOT EXISTS "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX IF NOT EXISTS "RefreshToken_token_idx" ON "RefreshToken"("token");

-- Agency indexes
CREATE INDEX IF NOT EXISTS "Agency_ownerId_idx" ON "Agency"("ownerId");
CREATE INDEX IF NOT EXISTS "Agency_status_idx" ON "Agency"("status");
CREATE INDEX IF NOT EXISTS "Agency_country_idx" ON "Agency"("country");

-- Vip indexes
CREATE INDEX IF NOT EXISTS "Vip_type_idx" ON "Vip"("type");
CREATE INDEX IF NOT EXISTS "Vip_expiryDate_idx" ON "Vip"("expiryDate");

-- RechargeLog indexes
CREATE INDEX IF NOT EXISTS "RechargeLog_userId_idx" ON "RechargeLog"("userId");
CREATE INDEX IF NOT EXISTS "RechargeLog_sellerId_idx" ON "RechargeLog"("sellerId");
CREATE INDEX IF NOT EXISTS "RechargeLog_createdAt_idx" ON "RechargeLog"("createdAt");

-- AudioRoom indexes
CREATE INDEX IF NOT EXISTS "AudioRoom_hostId_idx" ON "AudioRoom"("hostId");
CREATE INDEX IF NOT EXISTS "AudioRoom_isLive_idx" ON "AudioRoom"("isLive");
CREATE INDEX IF NOT EXISTS "AudioRoom_createdAt_idx" ON "AudioRoom"("createdAt");
CREATE INDEX IF NOT EXISTS "AudioRoom_provider_idx" ON "AudioRoom"("provider");

-- GiftTransaction indexes
CREATE INDEX IF NOT EXISTS "GiftTransaction_senderId_idx" ON "GiftTransaction"("senderId");
CREATE INDEX IF NOT EXISTS "GiftTransaction_receiverId_idx" ON "GiftTransaction"("receiverId");
CREATE INDEX IF NOT EXISTS "GiftTransaction_streamId_idx" ON "GiftTransaction"("streamId");
CREATE INDEX IF NOT EXISTS "GiftTransaction_giftId_idx" ON "GiftTransaction"("giftId");
CREATE INDEX IF NOT EXISTS "GiftTransaction_createdAt_idx" ON "GiftTransaction"("createdAt");

-- LuckyPack indexes
CREATE INDEX IF NOT EXISTS "LuckyPack_creatorId_idx" ON "LuckyPack"("creatorId");
CREATE INDEX IF NOT EXISTS "LuckyPack_roomId_idx" ON "LuckyPack"("roomId");
CREATE INDEX IF NOT EXISTS "LuckyPack_createdAt_idx" ON "LuckyPack"("createdAt");

-- Moment indexes
CREATE INDEX IF NOT EXISTS "Moment_userId_idx" ON "Moment"("userId");
CREATE INDEX IF NOT EXISTS "Moment_createdAt_idx" ON "Moment"("createdAt");
