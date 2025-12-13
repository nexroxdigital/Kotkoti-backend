-- Query to check if all indexes are created
-- Run this in your Neon SQL console to verify

SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
    AND (
        indexname LIKE '%_idx'
        OR indexname LIKE 'User_%'
        OR indexname LIKE 'AudioRoom_%'
        OR indexname LIKE 'GiftTransaction_%'
    )
ORDER BY
    tablename, indexname;

-- Expected to see 50+ indexes including:
-- User_agencyId_idx
-- User_vipId_idx
-- User_isHost_idx
-- AudioRoom_hostId_idx
-- AudioRoom_isLive_idx
-- GiftTransaction_senderId_idx
-- etc.
