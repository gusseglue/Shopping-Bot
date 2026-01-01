# @shopping-assistant/shared

Shared types, schemas, utilities, and constants for the Shopping Assistant monorepo.

## Installation

```bash
npm install @shopping-assistant/shared
```

## Usage

```typescript
import {
  // Types
  User,
  Watcher,
  Alert,
  
  // Schemas
  createWatcherSchema,
  loginSchema,
  
  // Utils
  formatDate,
  extractDomain,
  calculateBackoff,
  
  // Constants
  PLAN_LIMITS,
  ERROR_CODES,
} from '@shopping-assistant/shared'
```

## Contents

### Types

- `User` - User entity type
- `Device` - Device registration type
- `Subscription` - Subscription entity type
- `Watcher` - Watcher configuration type
- `Alert` - Alert entity type
- `WebhookConfig` - Webhook configuration type
- `AuditLog` - Audit log entry type
- And many more...

### Schemas (Zod)

- `createUserSchema` - User creation validation
- `loginSchema` - Login credentials validation
- `createWatcherSchema` - Watcher creation validation
- `updateWatcherSchema` - Watcher update validation
- `createWebhookSchema` - Webhook creation validation
- And many more...

### Utilities

- `formatDate()` - Format dates for display
- `formatRelativeTime()` - "2 hours ago" style formatting
- `extractDomain()` - Extract domain from URL
- `isDomainAllowed()` - Check if domain is allowed
- `calculateBackoff()` - Calculate exponential backoff
- `extractPrice()` - Extract price from text
- And many more...

### Constants

- `PLAN_LIMITS` - Limits for each subscription plan
- `ALLOWED_DOMAINS` - List of allowed monitoring domains
- `RATE_LIMITS` - Rate limiting configuration
- `ERROR_CODES` - Standardized error codes
- `TOKEN_CONFIG` - JWT token configuration
- And many more...

## Development

```bash
# Build the package
npm run build

# Watch mode
npm run dev

# Run tests
npm run test

# Type check
npm run typecheck
```
