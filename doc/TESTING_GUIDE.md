# Performance Testing Guide

## 🧪 How to Test the Improvements

### Step 1: Restart Your Application

```bash
# Stop the current running application (Ctrl+C)
# Then restart with:
npm run start:dev
```

You should see in the logs:

```
[PrismaService] Database connected successfully
```

### Step 2: Test the Database Ping Endpoint

**Before optimization:**

```
Response Time: 1.64s
TTFB: 1.53s
```

**Test now:**

```bash
curl https://kotkoti.stallforest.com/ping/db
```

**Expected result:**

```json
{
  "status": "ok",
  "latency": "30-100ms", // Should be < 150ms
  "timestamp": "2025-12-13T..."
}
```

### Step 3: Test Real-World Queries

#### Test 1: User Lookup by Email

```typescript
// This should now use the User_email_idx index
const user = await prisma.user.findUnique({
  where: { email: 'test@example.com' },
});
```

**Expected:** < 50ms

#### Test 2: Get Live Audio Rooms

```typescript
// This should now use AudioRoom_isLive_idx
const liveRooms = await prisma.audioRoom.findMany({
  where: { isLive: true },
  include: { host: true },
});
```

**Expected:** < 100ms

#### Test 3: Get User's Gift Transactions

```typescript
// This should now use GiftTransaction_senderId_idx
const gifts = await prisma.giftTransaction.findMany({
  where: { senderId: userId },
  orderBy: { createdAt: 'desc' },
  take: 20,
});
```

**Expected:** < 80ms

#### Test 4: Get Recent Moments

```typescript
// This should now use Moment_createdAt_idx
const moments = await prisma.moment.findMany({
  orderBy: { createdAt: 'desc' },
  take: 10,
  include: { user: true, likes: true },
});
```

**Expected:** < 100ms

### Step 4: Monitor Slow Queries

Check your application logs for:

```
[PrismaService] Slow query detected (1234ms): SELECT ...
```

If you see any slow queries:

1. Note which table/query is slow
2. Check if it has appropriate indexes
3. Add indexes if needed

### Step 5: Verify Indexes in Database

Run the verification query:

```bash
npx prisma db execute --file verify_indexes.sql
```

Or check in Neon SQL console:

```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%_idx'
ORDER BY tablename;
```

You should see 50+ indexes.

---

## 📊 Performance Benchmarking

### Create a Simple Benchmark Script

Create `test-performance.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function benchmark() {
  console.log('🧪 Starting performance tests...\n');

  // Test 1: User lookup by email
  const start1 = Date.now();
  await prisma.user.findFirst({ where: { email: { contains: '@' } } });
  console.log(`✓ User lookup: ${Date.now() - start1}ms`);

  // Test 2: Live rooms
  const start2 = Date.now();
  await prisma.audioRoom.findMany({ where: { isLive: true }, take: 10 });
  console.log(`✓ Live rooms: ${Date.now() - start2}ms`);

  // Test 3: Recent gifts
  const start3 = Date.now();
  await prisma.giftTransaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  console.log(`✓ Recent gifts: ${Date.now() - start3}ms`);

  // Test 4: Recent moments
  const start4 = Date.now();
  await prisma.moment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  console.log(`✓ Recent moments: ${Date.now() - start4}ms`);

  await prisma.$disconnect();
}

benchmark();
```

Run it:

```bash
npx ts-node test-performance.ts
```

**Expected output:**

```
🧪 Starting performance tests...

✓ User lookup: 45ms
✓ Live rooms: 67ms
✓ Recent gifts: 52ms
✓ Recent moments: 73ms
```

---

## 🎯 Success Criteria

Your optimization is successful if:

- [x] `/ping/db` responds in < 150ms (was 1640ms)
- [x] User lookups take < 50ms
- [x] Room queries take < 100ms
- [x] Gift queries take < 100ms
- [x] No "Slow query detected" warnings in logs
- [x] All 50+ indexes are created in database

---

## 🐛 Troubleshooting

### Issue: Still seeing slow queries

**Solution:**

1. Check if indexes are actually created: `npx prisma db execute --file verify_indexes.sql`
2. Restart your application to use new PrismaService
3. Check Neon dashboard for connection pool metrics

### Issue: "Slow query detected" warnings

**Solution:**

1. Note which query is slow
2. Check if the WHERE/JOIN columns have indexes
3. Add missing indexes if needed

### Issue: Connection pool errors

**Solution:**

1. Check DATABASE_URL is correct
2. Verify Neon connection pooler is enabled
3. Reduce max connections if hitting Neon limits

---

## 📈 Monitoring in Production

### 1. Enable Prisma Query Logging

Already enabled in PrismaService:

- Logs queries > 1000ms
- Logs all errors
- Logs connection lifecycle

### 2. Monitor Neon Dashboard

Check:

- Active connections (should be 5-20)
- Query performance metrics
- Connection pool usage

### 3. Add Application Metrics

Consider adding:

- Response time tracking
- Query count per endpoint
- Error rate monitoring

---

## 🚀 Next Level Optimizations

If you need even better performance:

1. **Enable Prisma Accelerate** - Query caching layer
2. **Add Redis** - Cache frequently accessed data
3. **Implement pagination** - Limit result sets
4. **Use select** - Only fetch needed fields
5. **Add read replicas** - Distribute read load

---

**Good luck with your promotion! 🎉**
