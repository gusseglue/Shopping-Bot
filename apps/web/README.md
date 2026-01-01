# Shopping Assistant Web

Next.js 14 frontend application for Shopping Assistant.

## Features

- **Landing Pages**: Marketing pages with pricing, FAQ, terms, privacy
- **Authentication**: Login, signup, and device management
- **Dashboard**: Product watchers, alerts, and settings
- **Billing**: Stripe subscription management
- **Admin**: User management (feature-flagged)

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- React Hook Form + Zod validation

## Prerequisites

- Node.js 20+
- Running API server (apps/api)

## Setup

1. **Install dependencies**

```bash
npm install
```

2. **Configure environment**

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Running

### Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm run start
```

## Project Structure

```
app/
├── page.tsx                 # Landing page
├── pricing/page.tsx         # Pricing page
├── faq/page.tsx             # FAQ page
├── terms/page.tsx           # Terms of service
├── privacy/page.tsx         # Privacy policy
├── (auth)/
│   ├── login/page.tsx       # Login page
│   └── signup/page.tsx      # Signup page
├── dashboard/
│   ├── layout.tsx           # Dashboard layout with sidebar
│   ├── page.tsx             # Dashboard overview
│   ├── watchers/page.tsx    # Watcher management
│   ├── alerts/page.tsx      # Alerts list
│   ├── settings/page.tsx    # Webhook settings
│   └── billing/page.tsx     # Subscription management
└── admin/
    └── page.tsx             # Admin panel (protected)

components/
├── ui/                      # shadcn/ui components
└── theme-provider.tsx       # Dark mode support

lib/
└── utils.ts                 # Utility functions
```

## Pages Overview

### Public Pages
- `/` - Landing page with features and pricing preview
- `/pricing` - Detailed pricing comparison
- `/faq` - Frequently asked questions
- `/terms` - Terms of service
- `/privacy` - Privacy policy

### Auth Pages
- `/(auth)/login` - User login
- `/(auth)/signup` - User registration

### Dashboard (Authenticated)
- `/dashboard` - Overview with stats
- `/dashboard/watchers` - Create and manage product watchers
- `/dashboard/alerts` - View and manage alerts
- `/dashboard/settings` - Configure Discord webhooks
- `/dashboard/billing` - Manage subscription

### Admin (Admin Role Only)
- `/admin` - User management and statistics

## Authentication

The app uses JWT tokens stored in localStorage:
- `accessToken` - Short-lived access token (15min)
- `refreshToken` - Long-lived refresh token (7 days)
- `user` - User profile JSON

## API Integration

All API calls are proxied through Next.js rewrites:
- Frontend: `http://localhost:3000/api/*`
- Backend: `http://localhost:3001/api/*`

## Styling

Uses Tailwind CSS with custom CSS variables for theming:
- Light/dark mode support via `next-themes`
- CSS variables defined in `app/globals.css`

## Testing

```bash
# Type check
npm run typecheck

# Lint
npm run lint
```

## Deployment

The app can be deployed to any platform supporting Next.js:
- Vercel (recommended)
- Render
- Fly.io
- Self-hosted with Docker

Set environment variables on your deployment platform:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```
