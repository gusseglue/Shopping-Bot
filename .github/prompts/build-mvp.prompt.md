# Build MVP Feature Prompt

This prompt guides Copilot agents through building features module by module for the Shopping Assistant application.

## How to Use This Prompt

When asking Copilot to build a feature, reference this document and specify which module you want to implement. Each module has clear boundaries and dependencies.

## ⚠️ Critical Constraints (Include in Every Request)

Always remind the agent of these constraints:
- NO auto-checkout or purchase automation
- NO queue/captcha/bot-detection bypassing
- Respect robots.txt and website terms
- Implement polite monitoring with throttling

---

## Module 1: Shared Package

**Request Template:**
```
Build the shared package (packages/shared) with:
- TypeScript configuration for shared library
- Common types (User, Watcher, Alert, Subscription, Device)
- Validation schemas using Zod
- Utility functions (date formatting, URL validation, throttle helpers)
- Constants (plan limits, allowed domains, error codes)

Dependencies: None
Output: npm package that can be imported by all apps
```

**Key Files:**
- `packages/shared/src/types/index.ts`
- `packages/shared/src/schemas/index.ts`
- `packages/shared/src/utils/index.ts`
- `packages/shared/src/constants/index.ts`

---

## Module 2: API Authentication

**Request Template:**
```
Build the API authentication module (apps/api/src/auth) with:
- Email/password login endpoint
- Magic link login endpoint (optional for MVP)
- JWT access tokens (15min expiry)
- Refresh token rotation (7 day expiry)
- Device registration endpoint
- Device verification middleware
- Token blacklist for logout/revocation

Security requirements:
- Hash passwords with bcrypt (cost factor 12)
- Store refresh tokens in database
- Bind tokens to device IDs
- Rate limit login attempts (5/min per IP)

Dependencies: Database schema, shared types
Output: Protected API routes with auth guards
```

**Key Files:**
- `apps/api/src/auth/auth.controller.ts`
- `apps/api/src/auth/auth.service.ts`
- `apps/api/src/auth/guards/jwt.guard.ts`
- `apps/api/src/auth/strategies/jwt.strategy.ts`

---

## Module 3: API Watchers

**Request Template:**
```
Build the watchers module (apps/api/src/watchers) with:
- CRUD endpoints for watchers
- URL validation against allowed domains
- Per-plan watcher limits enforcement
- Rule configuration (price threshold, stock status, size availability)
- Watcher status management (active/paused/error)

Business rules:
- Basic plan: max 10 watchers, min 5 min interval
- Pro plan: max 100 watchers, min 1 min interval
- Validate URL format and domain allowlist
- Store parsed product name and variant info

Dependencies: Auth module, Database schema
Output: /api/watchers/* endpoints
```

**Key Files:**
- `apps/api/src/watchers/watchers.controller.ts`
- `apps/api/src/watchers/watchers.service.ts`
- `apps/api/src/watchers/dto/create-watcher.dto.ts`
- `apps/api/src/watchers/entities/watcher.entity.ts`

---

## Module 4: API Alerts

**Request Template:**
```
Build the alerts module (apps/api/src/alerts) with:
- List alerts endpoint with pagination
- Mark alert as read endpoint
- Alert creation (internal, called by worker)
- Discord webhook integration
- Email notification sending (optional for MVP)

Features:
- Alert types: price_change, back_in_stock, size_available
- Include product details and diff info
- Rate limit Discord webhook sends
- Store webhook delivery status

Dependencies: Auth module, Watchers module
Output: /api/alerts/* endpoints
```

**Key Files:**
- `apps/api/src/alerts/alerts.controller.ts`
- `apps/api/src/alerts/alerts.service.ts`
- `apps/api/src/alerts/discord.service.ts`

---

## Module 5: API Billing

**Request Template:**
```
Build the billing module (apps/api/src/billing) with:
- Stripe webhook handler endpoint
- Handle subscription events (created, updated, canceled, payment_failed)
- Entitlements table management
- Customer portal session creation endpoint
- Checkout session creation endpoint

Events to handle:
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed

Dependencies: Auth module, User entity
Output: /api/billing/* endpoints, webhook handler
```

**Key Files:**
- `apps/api/src/billing/billing.controller.ts`
- `apps/api/src/billing/billing.service.ts`
- `apps/api/src/billing/stripe.service.ts`

---

## Module 6: Worker Service

**Request Template:**
```
Build the worker service (apps/worker) with:
- BullMQ queue configuration
- Scheduler that fetches due watcher jobs
- Per-domain throttle manager
- Exponential backoff on failures
- HTTP client with conditional requests (ETag)
- Site adapter plugin system

Throttling rules:
- Min 5 second delay per domain
- Max 10 concurrent requests globally
- Backoff: 30s, 1m, 2m, 5m on consecutive failures
- Respect Retry-After headers

Dependencies: Shared package, Database access
Output: Worker process that processes watcher jobs
```

**Key Files:**
- `apps/worker/src/index.ts`
- `apps/worker/src/scheduler.ts`
- `apps/worker/src/throttle-manager.ts`
- `apps/worker/src/adapters/base.adapter.ts`
- `apps/worker/src/adapters/example.adapter.ts`

---

## Module 7: Web Landing Pages

**Request Template:**
```
Build the public pages (apps/web) with:
- Landing page with hero, features, testimonials
- Pricing page with plan comparison
- FAQ page with accordion
- Terms of Service page
- Privacy Policy page
- Responsive design with Tailwind CSS
- shadcn/ui components

Design requirements:
- Dark/light mode support
- Mobile-first responsive design
- Accessible (WCAG 2.1 AA)
- SEO optimized with metadata

Dependencies: None
Output: Public marketing pages
```

**Key Files:**
- `apps/web/app/page.tsx` (landing)
- `apps/web/app/pricing/page.tsx`
- `apps/web/app/faq/page.tsx`
- `apps/web/app/terms/page.tsx`
- `apps/web/app/privacy/page.tsx`

---

## Module 8: Web Authentication

**Request Template:**
```
Build the auth pages (apps/web/app/(auth)) with:
- Sign up page with email/password form
- Login page with email/password form
- Device management page (list, revoke devices)
- Password reset flow (optional for MVP)
- Auth context and hooks
- Protected route wrapper

Features:
- Form validation with react-hook-form + zod
- Error handling and display
- Loading states
- Redirect after auth
- Remember device option

Dependencies: API auth endpoints
Output: Auth pages and auth state management
```

**Key Files:**
- `apps/web/app/(auth)/signup/page.tsx`
- `apps/web/app/(auth)/login/page.tsx`
- `apps/web/app/(auth)/devices/page.tsx`
- `apps/web/lib/auth-context.tsx`

---

## Module 9: Web Dashboard

**Request Template:**
```
Build the dashboard (apps/web/app/dashboard) with:
- Overview page with stats
- Watchers list page
- Create/edit watcher form
- Alerts list with filtering
- Discord webhook setup modal
- Webhook test button

Features:
- Real-time updates (polling or WebSocket)
- Pagination for lists
- Search and filter
- Empty states
- Loading skeletons

Dependencies: API endpoints, Auth context
Output: Dashboard pages for authenticated users
```

**Key Files:**
- `apps/web/app/dashboard/page.tsx`
- `apps/web/app/dashboard/watchers/page.tsx`
- `apps/web/app/dashboard/alerts/page.tsx`
- `apps/web/app/dashboard/settings/page.tsx`

---

## Module 10: Web Billing

**Request Template:**
```
Build the billing page (apps/web/app/dashboard/billing) with:
- Current plan display
- Usage statistics
- Upgrade/downgrade buttons
- Stripe customer portal link
- Invoice history (via portal)
- Cancel subscription flow

Dependencies: API billing endpoints, Stripe
Output: Billing management page
```

**Key Files:**
- `apps/web/app/dashboard/billing/page.tsx`
- `apps/web/components/billing/plan-card.tsx`

---

## Module 11: Web Admin

**Request Template:**
```
Build the admin page (apps/web/app/admin) with:
- User list with search
- Plan statistics
- Watcher count per user
- Feature flag for admin access
- Ability to view user details

Security:
- Only accessible to admin users
- Feature flagged (disabled by default)
- Audit log admin actions

Dependencies: API admin endpoints, Auth context
Output: Admin dashboard (feature-flagged)
```

**Key Files:**
- `apps/web/app/admin/page.tsx`
- `apps/web/app/admin/users/page.tsx`

---

## Module 12: Desktop Application

**Request Template:**
```
Build the desktop app (apps/desktop) with Tauri:
- Login window with device registration
- Main window with local watchers
- System tray with quick actions
- Notification system
- OS keychain for secrets
- Subscription verification on startup

Features:
- Auto-start option
- Minimize to tray
- Local watcher execution
- Discord webhook configuration
- Update checker (v2 feature, just UI)

Dependencies: API auth endpoints, Shared types
Output: Tauri desktop application
```

**Key Files:**
- `apps/desktop/src-tauri/src/main.rs`
- `apps/desktop/src/App.tsx`
- `apps/desktop/src/lib/auth.ts`
- `apps/desktop/src/lib/watcher.ts`

---

## Module 13: Database Schema

**Request Template:**
```
Create the database schema with:
- Users table (id, email, password_hash, name, role, created_at)
- Devices table (id, user_id, name, fingerprint, last_seen)
- Subscriptions table (id, user_id, stripe_id, plan, status, current_period_end)
- Watchers table (id, user_id, url, name, rules, interval, status, last_check)
- Alerts table (id, watcher_id, type, data, created_at, read_at)
- Audit_logs table (id, user_id, action, metadata, ip, created_at)
- Webhook_configs table (id, user_id, type, url_encrypted, created_at)

Requirements:
- Use UUIDs for primary keys
- Add proper indexes
- Field-level encryption for sensitive columns
- Timestamps with timezone

Dependencies: None
Output: Database migration files
```

---

## Module 14: Testing

**Request Template:**
```
Add tests for the specified module:
- Unit tests with mocks
- Integration tests with test database
- Coverage report

For API modules:
- Test controllers with supertest
- Test services with mocked repositories
- Test guards and middleware

For Worker:
- Test throttle manager
- Test site adapters
- Test scheduler logic

For Web:
- Playwright e2e tests for critical flows
- Component tests for complex components

Dependencies: Completed modules
Output: Test files with >80% coverage on critical paths
```

---

## Execution Order

For building the complete MVP, follow this order:
1. Shared Package (Module 1)
2. Database Schema (Module 13)
3. API Authentication (Module 2)
4. API Watchers (Module 3)
5. API Alerts (Module 4)
6. API Billing (Module 5)
7. Worker Service (Module 6)
8. Web Landing Pages (Module 7)
9. Web Authentication (Module 8)
10. Web Dashboard (Module 9)
11. Web Billing (Module 10)
12. Web Admin (Module 11)
13. Desktop Application (Module 12)
14. Testing (Module 14)

---

## Testing Your Build

After each module, verify:
1. `npm run typecheck` passes
2. `npm run lint` passes
3. `npm run test` passes
4. Manual testing of endpoints/pages works

## Common Issues

- **CORS errors**: Check API CORS configuration
- **Auth failures**: Verify JWT secret matches between apps
- **Database errors**: Run migrations before testing
- **Worker not processing**: Check Redis connection
