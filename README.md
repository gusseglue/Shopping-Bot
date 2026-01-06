# Shopping Assistant

A production-ready product monitoring and alerting platform that helps users track product availability, prices, and variants across online stores.

## ⚠️ Important Disclaimer

This software is designed for **monitoring and notifications only**. It does NOT and will NEVER:
- Automatically complete purchases
- Bypass queue systems, captchas, or bot detection
- Circumvent rate limits or website protections
- Violate website terms of service

The software respects `robots.txt` and implements polite monitoring with per-domain throttling.

## Features

### Basic Plan (Desktop App)
- Local product monitoring on your machine
- Create watchers with custom rules (price, stock, size)
- Discord webhook notifications
- Secure local storage with OS keychain
- Device-bound license verification

### Pro Plan (Cloud-Based)
- Server-side monitoring (no app needed)
- Higher limits and faster check intervals
- Advanced alert management
- Priority support

## Architecture

```
/
├── apps/
│   ├── web/          # Next.js 14 frontend (App Router)
│   ├── api/          # NestJS API server
│   ├── worker/       # BullMQ worker service
│   └── desktop/      # Tauri desktop application
├── packages/
│   └── shared/       # Shared types & utilities
├── infra/
│   └── docker-compose.yml
└── .github/
    ├── copilot-instructions.md
    └── prompts/
```

## Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, shadcn/ui
- **Backend**: NestJS, PostgreSQL, Redis
- **Worker**: BullMQ job queue
- **Desktop**: Tauri (Rust + React)
- **Payments**: Stripe Subscriptions
- **Auth**: JWT with device binding

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Rust 1.70+ (for desktop app)

### Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/gusseglue/Shopping-Bot.git
cd Shopping-Bot
```

2. **Install dependencies**
```bash
npm install
```

3. **Start infrastructure**
```bash
docker compose -f infra/docker-compose.yml up -d
```

4. **Set up environment variables**
```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env
```

5. **Run database migrations**
```bash
cd apps/api
npm run db:migrate
npm run db:seed
```

6. **Start development servers**
```bash
# Terminal 1 - API
cd apps/api && npm run start:dev

# Terminal 2 - Worker
cd apps/worker && npm run start:dev

# Terminal 3 - Web
cd apps/web && npm run dev
```

## Project Structure

| Directory | Description |
|-----------|-------------|
| `apps/web` | Next.js frontend application |
| `apps/api` | NestJS REST API |
| `apps/worker` | Background job processor |
| `apps/desktop` | Tauri desktop application |
| `packages/shared` | Shared types and utilities |
| `infra` | Docker and deployment configs |

## Security Features

- TLS everywhere
- JWT tokens with short expiry
- Device binding for tokens
- Field-level encryption for secrets
- Rate limiting and throttling
- Audit logging
- OS keychain for desktop secrets

## Environment Variables

See `.env.example` files in each app for required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT signing
- `STRIPE_SECRET_KEY` - Stripe API key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `ENCRYPTION_KEY` - Key for field-level encryption

## Testing

```bash
# Run all tests
npm run test

# Run specific app tests
cd apps/api && npm run test
cd apps/worker && npm run test
cd apps/web && npm run test
```

## Documentation

### For Server Owners/Administrators

See [Server Setup Guide](./docs/SERVER_SETUP.md) for complete instructions on:
- Installing prerequisites on Windows and Linux
- Setting up infrastructure (Docker, PostgreSQL, Redis)
- Configuring and running the API, Worker, and Web services
- Production deployment and security

### For End Users

See [User Guide](./docs/USER_GUIDE.md) for help with:
- Installing the desktop app on Windows and Linux
- Creating an account and managing watchers
- Setting up Discord notifications
- Troubleshooting common issues

### Deployment

See [deployment documentation](./docs/deployment.md) for production deployment guides:
- Docker Compose (self-hosted)
- Render
- Fly.io
- AWS ECS

## Feature Status

### ✅ Core Shopping Bot Features (Implemented)
| Feature | Status | Description |
|---------|--------|-------------|
| Product Monitoring | ✅ Ready | Monitor products for price changes, stock status, and size availability |
| Multi-Store Support | ✅ Ready | Supports Amazon, eBay, Walmart, Target, Best Buy, Newegg, Zalando, Nike, Adidas, Foot Locker |
| Custom Rules | ✅ Ready | Set price thresholds (below/above/change %), stock alerts, size availability |
| Discord Webhooks | ✅ Ready | Get instant notifications in Discord when alerts trigger |
| Slack Webhooks | ✅ Ready | Get notifications via Slack webhooks |
| Custom Webhooks | ✅ Ready | Send alerts to any HTTPS endpoint |
| User Dashboard | ✅ Ready | Web interface to manage watchers, view alerts, and configure settings |
| Subscription Billing | ✅ Ready | Stripe integration for Free, Basic, and Pro plans |
| Passkey/WebAuthn Auth | ✅ Ready | Secure passwordless login with passkeys |
| Desktop App | ✅ Ready | Tauri-based app for Windows, macOS, and Linux |
| Code-Signed Builds | ✅ Ready | Desktop releases can be code-signed for trusted installation |

### ✅ Security & Reliability Features
| Feature | Status | Description |
|---------|--------|-------------|
| Rate Limiting | ✅ Ready | Polite monitoring with per-domain throttling |
| robots.txt Compliance | ✅ Ready | Respects website restrictions |
| ETag Caching | ✅ Ready | Uses conditional requests to reduce bandwidth |
| Error Handling | ✅ Ready | Auto-pauses watchers after 5 consecutive failures |
| Audit Logging | ✅ Ready | Tracks all security-relevant actions |
| JWT + Device Binding | ✅ Ready | Secure authentication tied to devices |
| Field Encryption | ✅ Ready | Encrypts sensitive data like webhook URLs |

### 🚧 Planned Features (v3 Roadmap)
| Feature | Priority | Description |
|---------|----------|-------------|
| More Store Adapters | High | Add support for more stores (ASOS, H&M, Zara, etc.) |
| Email Notifications | High | Send alerts via email in addition to webhooks |
| SMS Notifications | Medium | Text message alerts for critical changes |
| Mobile App | Medium | React Native app for iOS/Android |
| Browser Extension | Medium | Quick-add products while browsing |
| Affiliate Integration | Low | Add affiliate links to product alerts |
| Price History Charts | Low | Visualize price trends over time |
| Restock Prediction | Low | ML-based prediction for when items might restock |

## Easy Setup Guide

### For End Users (Desktop App)
1. Download the installer for your platform from [Releases](https://github.com/gusseglue/Shopping-Bot/releases)
2. Install and launch the app
3. Create an account or sign in with passkey
4. Add a webhook (Discord/Slack) for notifications
5. Start adding products to watch!

### For Self-Hosting
```bash
# 1. Clone and setup
git clone https://github.com/gusseglue/Shopping-Bot.git
cd Shopping-Bot
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env
cp apps/web/.env.example apps/web/.env.local

# 2. Start infrastructure
docker compose -f infra/docker-compose.yml up -d

# 3. Install dependencies
npm install

# 4. Setup database
cd apps/api && npm run db:migrate && npm run db:seed && cd ..

# 5. Start all services (in separate terminals)
cd apps/api && npm run start:dev
cd apps/worker && npm run start:dev
cd apps/web && npm run dev
```

See [Server Setup Guide](./docs/SERVER_SETUP.md) for detailed production deployment instructions.

## Supported Stores

| Store | Price | Stock | Sizes | Notes |
|-------|-------|-------|-------|-------|
| Amazon (.com, .co.uk) | ✅ | ✅ | ❌ | Generic adapter with JSON-LD |
| eBay | ✅ | ✅ | ❌ | Generic adapter |
| Walmart | ✅ | ✅ | ❌ | Generic adapter |
| Target | ✅ | ✅ | ❌ | Generic adapter |
| Best Buy | ✅ | ✅ | ❌ | Generic adapter |
| Newegg | ✅ | ✅ | ❌ | Generic adapter |
| Zalando (DK, SE) | ✅ | ✅ | ✅ | Generic adapter |
| Nike | ✅ | ✅ | ✅ | Generic adapter |
| Adidas | ✅ | ✅ | ✅ | Generic adapter |
| Foot Locker | ✅ | ✅ | ✅ | Generic adapter |

**Want more stores?** The generic adapter works with most sites that use JSON-LD structured data. Open an issue for stores that need custom adapters.

## Plan Comparison

| Feature | Free | Basic | Pro |
|---------|------|-------|-----|
| Max Watchers | 3 | 10 | 100 |
| Check Interval | 10 min | 5 min | 1 min |
| Discord/Slack Webhooks | ✅ | ✅ | ✅ |
| Custom Webhooks | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.
