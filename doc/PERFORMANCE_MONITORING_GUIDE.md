# 🚀 API Performance Monitoring Guide

## Option 1: Automatic Logging (Recommended)

### Step 1: Enable the Performance Interceptor

Add this to your `src/main.ts`:

```typescript
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Add this line:
  app.useGlobalInterceptors(new PerformanceInterceptor());

  // ... rest of your code
}
```

### Step 2: Restart Your App

```bash
npm run start:dev
```

### Step 3: Watch the Logs

Every API request will now show:

```
⚡ GET /profile/view/me - 145ms
🟡 GET /rooms - 523ms
🐢 GET /moments - 2341ms
```

**Performance Indicators:**

- ⚡ **< 100ms** - Excellent
- ✅ **< 300ms** - Good
- 🟡 **< 500ms** - Acceptable
- 🟠 **< 1000ms** - Slow
- 🔴 **< 2000ms** - Very Slow
- 🐢 **> 2000ms** - Critical

---

## Option 2: Manual Testing Script

### Step 1: Run the Performance Test

```bash
node test-api-performance.js
```

### Step 2: With Authentication (if needed)

```bash
# Set your auth token
export AUTH_TOKEN="your-jwt-token-here"

# Or on Windows PowerShell:
$env:AUTH_TOKEN="your-jwt-token-here"

# Then run:
node test-api-performance.js
```

### Step 3: Test Against Production

```bash
API_URL="https://your-production-api.com" node test-api-performance.js
```

---

## Option 3: Continuous Monitoring

### Create a monitoring script that runs every minute:

**Windows (Task Scheduler):**

```powershell
# Create a scheduled task
schtasks /create /tn "API Monitor" /tr "node E:\Z Nexrox Digital\Kotkoti-backend\test-api-performance.js" /sc minute /mo 5
```

**Linux/Mac (Cron):**

```bash
# Add to crontab
*/5 * * * * cd /path/to/project && node test-api-performance.js >> api-performance.log
```

---

## Option 4: Advanced - Export to CSV

Add this to `test-api-performance.js` to save results:

```javascript
// At the end of runPerformanceTest()
const csv = results
  .map((r) => `${new Date().toISOString()},${r.name},${r.latency},${r.status}`)
  .join('\n');

fs.appendFileSync('performance-log.csv', csv + '\n');
```

---

## 📊 Sample Output

```
══════════════════════════════════════════════════════════════════
  🚀 API PERFORMANCE TEST
══════════════════════════════════════════════════════════════════

Testing: http://localhost:8000
Time: 2025-12-14T00:18:30.000Z

📊 Testing Endpoints...

✓ ⚡ Health Check                  42ms (200)
✓ 🟡 Database Ping                 387ms (200)
✓ 🔴 Profile View Me               1842ms (200)
✓ 🐢 List Rooms                    2156ms (200)
✓ 🔴 Moments Feed                  1523ms (200)

══════════════════════════════════════════════════════════════════
  📈 SUMMARY
══════════════════════════════════════════════════════════════════

Total Tests:     5
Successful:      5
Failed:          0
Average Latency: 1190ms

Performance Breakdown:
  ⚡ Fast (<300ms):     1
  🟡 Medium (300-1s):   1
  🐢 Slow (>1s):        3

🐢 Slowest Endpoints:
  1. List Rooms - 2156ms
  2. Profile View Me - 1842ms
  3. Moments Feed - 1523ms

══════════════════════════════════════════════════════════════════
```

---

## 🔧 Troubleshooting

### If the interceptor doesn't work:

1. Make sure you imported it correctly in `main.ts`
2. Check that `PerformanceInterceptor` is in the right path
3. Restart your dev server

### If the script fails:

```bash
# Install dependencies if needed
npm install node-fetch

# Or use native fetch (Node 18+)
node --version  # Should be 18+
```

---

## 📈 Next Steps

1. **Enable the interceptor** to see real-time latency
2. **Run the test script** to get a baseline
3. **Identify slow endpoints** from the logs
4. **Fix the issues** using the audit report recommendations

---

**Pro Tip:** Run the test script before and after each optimization to measure improvement!
