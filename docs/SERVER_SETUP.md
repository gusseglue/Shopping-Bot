# Server Setup Guide

This guide covers how to set up the Shopping Assistant server infrastructure for **owners/administrators** who want to deploy and host the platform.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Windows Setup](#windows-setup)
- [Linux Setup](#linux-setup)
- [Infrastructure Setup](#infrastructure-setup)
- [API Server Setup](#api-server-setup)
- [Worker Service Setup](#worker-service-setup)
- [Web Frontend Setup](#web-frontend-setup)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB |
| Storage | 20 GB | 50+ GB SSD |
| OS | Windows 10/11 or Ubuntu 20.04+ | Ubuntu 22.04 LTS |

### Required Software

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **Docker** & **Docker Compose** ([Docker Desktop](https://www.docker.com/products/docker-desktop/) for Windows)
- **Git** ([Download](https://git-scm.com/))
- **Rust** 1.70+ (only if building desktop app)

### Required Accounts

- **Stripe Account** - For payment processing ([Stripe Dashboard](https://dashboard.stripe.com/))
  - API keys (publishable and secret)
  - Webhook secret

---

## Windows Setup

### Step 1: Install Node.js

1. Download the Node.js LTS installer from [nodejs.org](https://nodejs.org/)
2. Run the installer and follow the prompts
3. Verify installation:
   ```powershell
   node --version
   npm --version
   ```

### Step 2: Install Docker Desktop

1. Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)
2. Run the installer (requires WSL 2 on Windows 10/11)
3. Enable WSL 2 if prompted and restart your computer
4. Start Docker Desktop
5. Verify installation:
   ```powershell
   docker --version
   docker compose version
   ```

### Step 3: Install Git

1. Download Git from [git-scm.com](https://git-scm.com/download/win)
2. Run the installer with default options
3. Verify installation:
   ```powershell
   git --version
   ```

### Step 4: Clone the Repository

```powershell
# Open PowerShell or Command Prompt
git clone https://github.com/gusseglue/Shopping-Bot.git
cd Shopping-Bot
```

### Step 5: Install Dependencies

```powershell
npm install
```

---

## Linux Setup

### Step 1: Install Node.js

**Ubuntu/Debian:**
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

**Fedora/RHEL:**
```bash
# Install Node.js 20.x
sudo dnf module install nodejs:20

# Verify installation
node --version
npm --version
```

### Step 2: Install Docker

**Ubuntu/Debian:**
```bash
# Install Docker
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add your user to docker group (avoids sudo for docker commands)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

**Fedora/RHEL:**
```bash
sudo dnf install -y docker docker-compose-plugin
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

### Step 3: Install Git

```bash
# Ubuntu/Debian
sudo apt-get install -y git

# Fedora/RHEL
sudo dnf install -y git

# Verify
git --version
```

### Step 4: Clone the Repository

```bash
git clone https://github.com/gusseglue/Shopping-Bot.git
cd Shopping-Bot
```

### Step 5: Install Dependencies

```bash
npm install
```

---

## Infrastructure Setup

The Shopping Assistant requires PostgreSQL and Redis. The easiest way to run these is with Docker Compose.

### Start Infrastructure Services

```bash
# From the project root directory
docker compose -f infra/docker-compose.yml up -d
```

This starts:
- **PostgreSQL** on port `5432`
- **Redis** on port `6379`
- **pgAdmin** (optional) on port `5050` for database management
- **Redis Commander** (optional) on port `8081` for Redis management

### Verify Services

```bash
# Check that containers are running
docker ps

# Expected output shows:
# - shopping-assistant-db (PostgreSQL)
# - shopping-assistant-redis (Redis)
```

### Optional: Access Admin Tools

- **pgAdmin**: Open http://localhost:5050
  - Email: `admin@example.com`
  - Password: `admin`
  - Add server with host `postgres`, user `postgres`, password `postgres`

- **Redis Commander**: Open http://localhost:8081

---

## API Server Setup

### Step 1: Configure Environment Variables

```bash
# Navigate to API directory
cd apps/api

# Copy example environment file
cp .env.example .env
```

Edit `apps/api/.env` with your configuration:

```env
# Database (matches Docker Compose settings)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/shopping_assistant?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secret - CHANGE THIS in production!
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"

# Stripe (get from Stripe Dashboard)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# CORS Origins
CORS_ORIGINS="http://localhost:3000,http://localhost:3001"

# Server
PORT=3001
NODE_ENV=development

# Encryption Key (32 bytes hex) - CHANGE THIS in production!
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
```

### Step 2: Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Seed database with sample data
npm run db:seed
```

### Step 3: Start API Server

**Development:**
```bash
npm run start:dev
```

**Production:**
```bash
npm run build
npm run start:prod
```

### Step 4: Verify API

Open http://localhost:3001/api/docs to see the Swagger API documentation.

---

## Worker Service Setup

The worker processes background jobs for monitoring products.

### Step 1: Configure Environment Variables

```bash
# Navigate to worker directory
cd apps/worker

# Copy example environment file
cp .env.example .env
```

Edit `apps/worker/.env`:

```env
# Redis
REDIS_URL="redis://localhost:6379"

# Database (same as API)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/shopping_assistant?schema=public"

# Worker Configuration
WORKER_CONCURRENCY=5
POLL_INTERVAL=30000

# Logging
LOG_LEVEL=info
```

### Step 2: Start Worker

**Development:**
```bash
npm run start:dev
```

**Production:**
```bash
npm run build
npm run start
```

---

## Web Frontend Setup

### Step 1: Configure Environment Variables

```bash
# Navigate to web directory
cd apps/web

# Copy example environment file
cp .env.example .env.local
```

Edit `apps/web/.env.local`:

```env
# API URL (backend)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Site URL (this frontend)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 2: Start Web Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm run start
```

### Step 3: Access the Website

Open http://localhost:3000 in your browser.

---

## Production Deployment

### Security Checklist

Before deploying to production:

- [ ] Change all default passwords and secrets
- [ ] Generate strong `JWT_SECRET` (use `openssl rand -hex 32`)
- [ ] Generate strong `ENCRYPTION_KEY` (use `openssl rand -hex 32`)
- [ ] Use production Stripe keys (not test keys)
- [ ] Enable HTTPS/TLS for all services
- [ ] Configure proper firewall rules
- [ ] Set up database backups
- [ ] Configure proper logging and monitoring

### Running All Services

**Using Multiple Terminals (Development):**

```bash
# Terminal 1 - API
cd apps/api && npm run start:dev

# Terminal 2 - Worker
cd apps/worker && npm run start:dev

# Terminal 3 - Web
cd apps/web && npm run dev
```

**Using Process Manager (Production):**

We recommend using PM2 for production:

```bash
# Install PM2
npm install -g pm2

# Start services
pm2 start apps/api/dist/main.js --name "api"
pm2 start apps/worker/dist/index.js --name "worker"
cd apps/web && pm2 start npm --name "web" -- start

# Save configuration
pm2 save
pm2 startup
```

### Docker Deployment

For containerized deployment, see the `infra/` directory for Docker Compose configurations.

### Reverse Proxy Configuration

**Nginx Example:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Troubleshooting

### Docker Issues

**"Cannot connect to Docker daemon"**

Windows:
- Make sure Docker Desktop is running
- Check that WSL 2 is properly installed

Linux:
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

**"Port already in use"**

```bash
# Find what's using the port (e.g., 5432)
# Windows
netstat -ano | findstr :5432

# Linux
sudo lsof -i :5432

# Kill the process or change ports in docker-compose.yml
```

### Database Issues

**"Connection refused to PostgreSQL"**

1. Verify Docker container is running:
   ```bash
   docker ps
   ```

2. Check container logs:
   ```bash
   docker logs shopping-assistant-db
   ```

3. Verify connection string in `.env` files

**"Migration failed"**

```bash
# Reset database (WARNING: deletes all data)
cd apps/api
npx prisma migrate reset
```

### Node.js Issues

**"Module not found"**

```bash
# Clear node_modules and reinstall
rm -rf node_modules
rm package-lock.json
npm install
```

**"Permission denied"**

Linux:
```bash
# Don't use sudo with npm
# Instead, fix npm permissions:
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### API Issues

**"Cannot reach API at localhost:3001"**

1. Verify API is running
2. Check firewall settings
3. Verify CORS settings in `.env`

### Stripe Issues

**"Stripe webhook signature verification failed"**

1. Ensure you're using the correct webhook secret
2. For local development, use Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:3001/api/billing/webhook
   ```

---

## Getting Help

- Check the [README.md](../README.md) for quick reference
- Review individual app READMEs in `apps/*/README.md`
- Open an issue on GitHub for bugs or feature requests

---

## Next Steps

After setting up the server:

1. Create an admin account via the API or database
2. Configure Stripe products and prices
3. Test the complete user flow
4. Set up monitoring and logging
5. Configure automated backups
