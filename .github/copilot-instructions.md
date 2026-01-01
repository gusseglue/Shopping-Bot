# Copilot Instructions for Shopping Assistant

## Project Overview
Shopping Assistant is a product monitoring and alerting platform that helps users track product availability, prices, and variants across online stores. It sends notifications via web, email, and Discord webhooks.

## ⚠️ NON-NEGOTIABLE CONSTRAINTS

### Prohibited Behaviors
The following behaviors are **STRICTLY FORBIDDEN** and must never be implemented:

1. **NO Automatic Purchases** - Never implement code that clicks "Buy", "Place Order", or completes checkout flows
2. **NO Queue Bypassing** - Never attempt to circumvent queue systems on any website
3. **NO Captcha Solving** - Never implement or integrate captcha solving mechanisms
4. **NO Rate Limit Evasion** - Never try to bypass or evade rate limits
5. **NO Bot Detection Circumvention** - Never implement techniques to avoid bot detection
6. **NO Headless Checkout Automation** - Only monitoring, notifications, and optional local prefill

### Required Behaviors
1. **Respect robots.txt** - Always check and honor robots.txt directives
2. **Honor Terms of Service** - Respect webshop terms and conditions
3. **Polite Monitoring** - Implement per-domain throttling, exponential backoff, and caching
4. **Conditional Requests** - Use ETag/If-Modified-Since headers when available

## Coding Standards

### TypeScript/JavaScript
- Use TypeScript for all frontend and Node.js code
- Enable strict mode in tsconfig.json
- Use ESLint with recommended rules
- Format with Prettier (2 space indent, single quotes, no semicolons)
- Prefer functional components with hooks in React
- Use async/await over raw promises

### Python
- Python 3.11+
- Use type hints throughout
- Format with Black (line length 88)
- Lint with ruff
- Use pydantic for data validation

### Rust (Desktop App)
- Use Rust 2021 edition
- Format with rustfmt
- Lint with clippy
- Handle all Result/Option types explicitly

### General
- Write descriptive variable and function names
- Keep functions small and focused
- Add JSDoc/docstrings for public APIs
- No magic numbers - use named constants

## Branch Strategy
- `main` - Production-ready code, protected
- `develop` - Integration branch for features
- `feature/*` - Feature branches (e.g., `feature/add-discord-webhook`)
- `fix/*` - Bug fix branches
- `release/*` - Release preparation branches

### Commit Messages
Follow conventional commits:
```
feat: add Discord webhook integration
fix: resolve rate limiting issue on API
docs: update README with setup instructions
test: add unit tests for watcher service
chore: update dependencies
```

## Test Strategy

### Unit Tests
- Test business logic in isolation
- Mock external dependencies
- Aim for 80%+ coverage on critical paths
- Use Jest for Node.js, pytest for Python, rust test for Rust

### Integration Tests
- Test API endpoints with database
- Test worker job processing
- Use test containers for database

### E2E Tests
- Use Playwright for web application
- Test critical user flows (auth, create watcher, view alerts)

### Test Naming
```
describe('WatcherService', () => {
  it('should create a watcher with valid URL', () => {})
  it('should reject watcher for blocked domain', () => {})
})
```

## Security Rules

### Authentication
- Use JWT/PASETO tokens with short expiry (15min access, 7day refresh)
- Device registration required on first login
- Token refresh must validate device binding
- Invalidate all tokens on password change

### Data Protection
- TLS everywhere (enforce HTTPS)
- Field-level encryption for sensitive data (webhook secrets)
- Use OS keychain for desktop secrets (never plaintext)
- Sanitize all user inputs
- Use parameterized queries (never string concatenation)

### API Security
- Rate limiting on all endpoints
- IP throttling for abuse prevention
- Per-domain concurrency limits
- Audit logging for sensitive operations

### Secrets Management
- Never commit secrets to repository
- Use environment variables
- Document required env vars in .env.example
- Use different secrets for dev/staging/prod

## Running the Project Locally

### Prerequisites
- Node.js 20+
- Python 3.11+
- Rust 1.70+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### Setup Steps

1. **Clone and Install**
```bash
git clone <repo-url>
cd shopping-assistant

# Install root dependencies
npm install

# Install app dependencies
npm run install:all
```

2. **Environment Setup**
```bash
# Copy environment files
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env

# Update with your values
```

3. **Start Infrastructure**
```bash
docker compose -f infra/docker-compose.yml up -d
```

4. **Database Setup**
```bash
cd apps/api
npm run db:migrate
npm run db:seed
```

5. **Start Development Servers**
```bash
# Terminal 1 - API
cd apps/api && npm run dev

# Terminal 2 - Worker
cd apps/worker && npm run dev

# Terminal 3 - Web
cd apps/web && npm run dev

# Terminal 4 - Desktop (optional)
cd apps/desktop && npm run tauri dev
```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run test` | Run tests |
| `npm run lint` | Run linter |
| `npm run typecheck` | TypeScript type checking |

## Architecture Overview

```
/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # NestJS API server
│   ├── worker/       # BullMQ worker service
│   └── desktop/      # Tauri desktop app
├── packages/
│   └── shared/       # Shared types & utilities
├── infra/
│   └── docker-compose.yml
└── .github/
    ├── copilot-instructions.md
    └── prompts/
```

## Database Schema (Key Tables)

- `users` - User accounts and profiles
- `devices` - Registered devices for auth
- `subscriptions` - Stripe subscription data
- `watchers` - Product monitoring configurations
- `alerts` - Generated alerts from watchers
- `audit_logs` - Security and activity logs

## API Rate Limits

| Plan | Watchers | Check Interval | API Calls/min |
|------|----------|----------------|---------------|
| Basic | 10 | 5 min | 30 |
| Pro | 100 | 1 min | 100 |

## Domain Throttling

- Minimum 5 second delay between requests to same domain
- Exponential backoff on errors (max 5 min delay)
- Respect Retry-After headers
- Cache responses with ETag support
