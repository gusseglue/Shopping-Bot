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

## Deployment

See [deployment documentation](./docs/deployment.md) for production deployment guides:
- Docker Compose (self-hosted)
- Render
- Fly.io
- AWS ECS

## Next Steps (v2 Roadmap)

- [ ] Passkeys/WebAuthn authentication
- [ ] Code-signed desktop builds
- [ ] Mobile app (React Native)
- [ ] Affiliate integration
- [ ] Browser extension
- [ ] SMS notifications
- [ ] Slack integration

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.
