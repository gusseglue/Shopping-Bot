# Shopping Assistant Worker

Background worker service for processing watcher jobs and checking product pages.

## Features

- **Job Queue**: BullMQ-based job processing with Redis
- **Per-Domain Throttling**: Respects rate limits and implements polite monitoring
- **Exponential Backoff**: Automatic retry with increasing delays on failures
- **Site Adapters**: Plugin-based HTML parsing for different websites
- **Conditional Requests**: Uses ETag/If-Modified-Since when available

## ⚠️ Important Constraints

This worker implements **polite monitoring** only:
- Minimum 5 second delay between requests to the same domain
- Respects robots.txt (checked by adapters)
- Uses conditional requests to reduce bandwidth
- Does NOT bypass any protection mechanisms

## Prerequisites

- Node.js 20+
- Redis 7+
- PostgreSQL 15+ (shared with API)

## Setup

1. **Install dependencies**

```bash
npm install
```

2. **Configure environment**

```bash
cp .env.example .env
# Edit .env with your values
```

3. **Ensure database is set up**

The worker shares the database with the API. Make sure migrations are run.

## Running

### Development

```bash
npm run start:dev
```

### Production

```bash
npm run build
npm run start
```

## Architecture

```
src/
├── index.ts                 # Entry point and worker setup
├── services/
│   ├── scheduler.ts         # Polls for due watchers
│   ├── throttle-manager.ts  # Per-domain rate limiting
│   └── watcher-processor.ts # Main job processor
└── adapters/
    ├── base.adapter.ts      # Abstract adapter class
    ├── generic.adapter.ts   # Fallback generic parser
    └── example.adapter.ts   # Demo adapter for testing
```

## Adding Site Adapters

Create a new adapter in `src/adapters/`:

```typescript
import { BaseAdapter, AdapterResult } from './base.adapter'
import * as cheerio from 'cheerio'

export class MySiteAdapter extends BaseAdapter {
  domain = 'mysite.com'

  parse(html: string, url: string): AdapterResult {
    const $ = cheerio.load(html)
    
    return {
      success: true,
      url,
      title: this.getText($, '.product-title'),
      price: this.extractPrice(this.getText($, '.price') || ''),
      inStock: $('.in-stock').length > 0,
    }
  }
}
```

Then register it in `watcher-processor.ts`:

```typescript
this.adapters.set('mysite.com', new MySiteAdapter())
```

## Job Processing Flow

1. **Scheduler** polls database for due watchers (based on interval)
2. **Queue** receives jobs with watcher details
3. **Throttle Manager** ensures polite request timing
4. **Processor** fetches page and parses with appropriate adapter
5. **Rules** are checked against previous results
6. **Alerts** are created when rules match
7. **Webhooks** are triggered for user notifications

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `DATABASE_URL` | - | PostgreSQL connection |
| `WORKER_CONCURRENCY` | `5` | Max concurrent jobs |
| `POLL_INTERVAL` | `30000` | Scheduler poll interval (ms) |

## Throttling Behavior

| Consecutive Errors | Delay |
|-------------------|-------|
| 0 | 5 seconds |
| 1 | 10 seconds |
| 2 | 20 seconds |
| 3 | 40 seconds |
| 4 | 80 seconds |
| 5+ | 5 minutes (max) |

## Testing

```bash
npm run test
```

## Monitoring

The worker logs structured JSON for easy monitoring:

```json
{
  "level": 30,
  "time": 1704067200000,
  "service": "watcher-processor",
  "watcherId": "abc123",
  "msg": "Job completed"
}
```
