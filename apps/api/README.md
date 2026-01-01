# Shopping Assistant API

NestJS-based REST API for the Shopping Assistant platform.

## Features

- **Authentication**: JWT-based auth with refresh tokens and device registration
- **Watchers**: CRUD operations for product watchers with domain validation
- **Alerts**: Alert management and notification system
- **Webhooks**: Discord/Slack webhook integration
- **Billing**: Stripe subscription management

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Stripe account (for billing)

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

3. **Generate Prisma client**

```bash
npm run db:generate
```

4. **Run database migrations**

```bash
npm run db:migrate:dev
```

5. **Seed database (optional)**

```bash
npm run db:seed
```

## Running

### Development

```bash
npm run start:dev
```

### Production

```bash
npm run build
npm run start:prod
```

## API Documentation

Once running, visit `http://localhost:3001/api/docs` for Swagger UI.

## Available Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/devices` - Register device
- `GET /api/auth/devices` - List devices
- `DELETE /api/auth/devices/:id` - Revoke device

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update profile
- `GET /api/users` - List all users (admin)
- `GET /api/users/stats` - User statistics (admin)

### Watchers
- `POST /api/watchers` - Create watcher
- `GET /api/watchers` - List watchers
- `GET /api/watchers/:id` - Get watcher
- `PUT /api/watchers/:id` - Update watcher
- `DELETE /api/watchers/:id` - Delete watcher
- `POST /api/watchers/:id/pause` - Pause watcher
- `POST /api/watchers/:id/resume` - Resume watcher

### Alerts
- `GET /api/alerts` - List alerts
- `GET /api/alerts/unread-count` - Get unread count
- `GET /api/alerts/:id` - Get alert
- `POST /api/alerts/:id/read` - Mark as read
- `POST /api/alerts/read-all` - Mark all as read
- `DELETE /api/alerts/:id` - Delete alert

### Webhooks
- `GET /api/webhooks` - List webhooks
- `POST /api/webhooks` - Create webhook
- `GET /api/webhooks/:id` - Get webhook
- `PUT /api/webhooks/:id` - Update webhook
- `DELETE /api/webhooks/:id` - Delete webhook
- `POST /api/webhooks/:id/test` - Test webhook

### Billing
- `GET /api/billing/subscription` - Get subscription
- `POST /api/billing/checkout` - Create checkout session
- `POST /api/billing/portal` - Create portal session
- `POST /api/billing/webhook` - Stripe webhook handler

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## Database

### View database

```bash
npm run db:studio
```

### Reset database

```bash
npx prisma migrate reset
```

## Security Notes

- JWT tokens expire after 15 minutes
- Refresh tokens expire after 7 days
- All sensitive data is encrypted at rest
- Rate limiting is enabled on all endpoints
- Device binding prevents token theft
