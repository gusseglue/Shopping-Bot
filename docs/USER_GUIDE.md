# User Guide

This guide helps **end users** get started with Shopping Assistant to monitor products and receive alerts for price changes and stock availability.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Desktop App Installation](#desktop-app-installation)
  - [Windows Installation](#windows-installation)
  - [Linux Installation](#linux-installation)
- [Web Application](#web-application)
- [Creating Your Account](#creating-your-account)
- [Creating Watchers](#creating-watchers)
- [Managing Alerts](#managing-alerts)
- [Setting Up Discord Webhooks](#setting-up-discord-webhooks)
- [Subscription Plans](#subscription-plans)
- [Troubleshooting](#troubleshooting)

---

## Overview

Shopping Assistant helps you:

- **Monitor products** across online stores for price changes and stock availability
- **Receive alerts** via desktop notifications, email, or Discord when products match your rules
- **Track variants** like sizes, colors, and other product options
- **Save money** by being notified when prices drop

### ⚠️ Important Note

Shopping Assistant is a **monitoring and notification tool only**. It will NOT:
- Automatically purchase products for you
- Bypass queue systems or captchas
- Circumvent any website protections

---

## Getting Started

You have two options to use Shopping Assistant:

| Feature | Desktop App (Basic Plan) | Web App (Pro Plan) |
|---------|-------------------------|-------------------|
| Monitoring Location | Your computer | Cloud servers |
| Requires App Running | Yes | No |
| Number of Watchers | Up to 10 | Up to 100 |
| Check Interval | 5 minutes | 1 minute |
| Notifications | Desktop + Discord | Web + Email + Discord |

---

## Desktop App Installation

### Windows Installation

#### Step 1: Download the Installer

1. Go to the [Releases page](https://github.com/gusseglue/Shopping-Bot/releases)
2. Download the latest `.msi` or `.exe` installer for Windows

#### Step 2: Install the Application

1. Double-click the downloaded installer
2. If Windows SmartScreen appears, click **"More info"** → **"Run anyway"**
3. Follow the installation wizard
4. The app will be installed to `C:\Program Files\Shopping Assistant`

#### Step 3: Install WebView2 (if needed)

Windows 11 includes WebView2 by default. For Windows 10:

1. If prompted, download [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)
2. Run the installer
3. Restart Shopping Assistant

#### Step 4: Launch the Application

1. Find **Shopping Assistant** in your Start menu
2. Click to launch
3. The app will appear in your system tray

---

### Linux Installation

#### Step 1: Install System Dependencies

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y libgtk-3-0 libwebkit2gtk-4.0-37 libappindicator3-1 librsvg2-2
```

**Fedora:**
```bash
sudo dnf install -y gtk3 webkit2gtk3 libappindicator-gtk3 librsvg2
```

**Arch Linux:**
```bash
sudo pacman -S gtk3 webkit2gtk libappindicator-gtk3 librsvg
```

#### Step 2: Download the Application

1. Go to the [Releases page](https://github.com/gusseglue/Shopping-Bot/releases)
2. Download the appropriate package:
   - `.deb` for Ubuntu/Debian
   - `.rpm` for Fedora/RHEL
   - `.AppImage` for universal Linux

#### Step 3: Install the Application

**For .deb (Ubuntu/Debian):**
```bash
sudo dpkg -i shopping-assistant_*.deb
sudo apt-get install -f  # Fix any dependency issues
```

**For .rpm (Fedora/RHEL):**
```bash
sudo rpm -i shopping-assistant_*.rpm
```

**For .AppImage:**
```bash
chmod +x shopping-assistant_*.AppImage
./shopping-assistant_*.AppImage
```

#### Step 4: Launch the Application

- Find **Shopping Assistant** in your application menu, or
- Run from terminal: `shopping-assistant`

---

## Web Application

The web application is available for **Pro Plan** subscribers.

### Accessing the Web App

1. Open your web browser
2. Navigate to the Shopping Assistant website (provided by your administrator)
3. Log in with your account credentials

### Supported Browsers

- Google Chrome (recommended)
- Mozilla Firefox
- Microsoft Edge
- Safari

---

## Creating Your Account

### Step 1: Sign Up

1. Open the Shopping Assistant app or website
2. Click **"Sign Up"** or **"Create Account"**
3. Enter your details:
   - Email address
   - Password (minimum 8 characters)
   - Confirm password
4. Click **"Create Account"**

### Step 2: Verify Your Email

1. Check your email inbox for a verification message
2. Click the verification link
3. Your account is now active

### Step 3: Log In

1. Enter your email and password
2. Click **"Log In"**
3. For desktop app: Your device will be registered automatically

---

## Creating Watchers

Watchers monitor products and alert you when conditions are met.

### Step 1: Navigate to Watchers

- **Desktop App**: Click the **"Watchers"** tab in the sidebar
- **Web App**: Go to **Dashboard** → **Watchers**

### Step 2: Create a New Watcher

1. Click **"+ New Watcher"** or **"Add Watcher"**
2. Fill in the details:

| Field | Description | Example |
|-------|-------------|---------|
| **Name** | A friendly name for your watcher | "Nike Air Max" |
| **URL** | The product page URL | `https://store.com/product/123` |
| **Check Interval** | How often to check (Pro plan only) | 5 minutes |

### Step 3: Set Alert Rules

Configure when you want to be notified:

| Rule Type | Description | Example |
|-----------|-------------|---------|
| **Price Drop** | Alert when price drops below a value | Alert if < $100 |
| **Price Change** | Alert on any price change | Alert on any change |
| **In Stock** | Alert when product becomes available | Alert when in stock |
| **Specific Variant** | Alert for specific size/color | Size US 10, Black |

### Step 4: Save and Activate

1. Click **"Save Watcher"** or **"Create"**
2. The watcher starts monitoring immediately
3. You'll see a green status indicator when active

### Managing Watchers

| Action | How To |
|--------|--------|
| **Pause** | Click the pause icon to temporarily stop monitoring |
| **Resume** | Click the play icon to resume monitoring |
| **Edit** | Click the edit icon or watcher name to modify |
| **Delete** | Click the trash icon and confirm deletion |

---

## Managing Alerts

### Viewing Alerts

- **Desktop App**: Click the **"Alerts"** tab or notification bell icon
- **Web App**: Go to **Dashboard** → **Alerts**

### Alert Information

Each alert shows:
- Product name and URL
- The condition that triggered the alert
- Timestamp
- Current price/stock status

### Alert Actions

| Action | Description |
|--------|-------------|
| **Mark as Read** | Dismiss the alert |
| **View Product** | Open the product page |
| **Mark All Read** | Clear all alerts |
| **Delete** | Permanently remove the alert |

### Notification Settings

Configure how you receive alerts:

1. Go to **Settings** → **Notifications**
2. Enable/disable notification types:
   - Desktop notifications
   - Email notifications
   - Discord webhooks

---

## Setting Up Discord Webhooks

Discord webhooks let you receive alerts in your Discord server.

### Step 1: Create a Discord Webhook

1. Open Discord and go to your server
2. Right-click a text channel → **"Edit Channel"**
3. Go to **"Integrations"** → **"Webhooks"**
4. Click **"New Webhook"**
5. Give it a name (e.g., "Shopping Assistant")
6. Click **"Copy Webhook URL"**

### Step 2: Add Webhook to Shopping Assistant

1. Open Shopping Assistant
2. Go to **Settings** → **Webhooks** (or **Dashboard** → **Settings**)
3. Click **"+ Add Webhook"**
4. Enter:
   - **Name**: A descriptive name (e.g., "My Discord #deals")
   - **URL**: Paste the Discord webhook URL
5. Click **"Save"** or **"Add"**

### Step 3: Test the Webhook

1. Find your webhook in the list
2. Click **"Test"** or the test icon
3. Check your Discord channel for a test message

### Webhook Configuration

| Option | Description |
|--------|-------------|
| **Enable/Disable** | Toggle webhook on/off without deleting |
| **Alert Types** | Choose which alerts trigger the webhook |
| **Custom Message** | (Pro) Customize the alert message format |

---

## Subscription Plans

### Basic Plan (Desktop App)

- **Price**: Free or one-time purchase
- **Features**:
  - Up to 10 product watchers
  - 5-minute check interval
  - Desktop notifications
  - Discord webhooks
  - Local monitoring (requires app running)

### Pro Plan (Cloud)

- **Price**: Monthly subscription
- **Features**:
  - Up to 100 product watchers
  - 1-minute check interval
  - Web dashboard access
  - Email notifications
  - Discord & Slack webhooks
  - Cloud monitoring (no app needed)
  - Priority support

### Managing Your Subscription

1. Go to **Settings** → **Billing** (or **Dashboard** → **Billing**)
2. View your current plan
3. Click **"Manage Subscription"** to:
   - Upgrade/downgrade plan
   - Update payment method
   - View billing history
   - Cancel subscription

---

## Troubleshooting

### Desktop App Won't Start

**Windows:**
1. Right-click the app → **"Run as administrator"**
2. Check if WebView2 is installed
3. Try reinstalling the application

**Linux:**
1. Verify dependencies are installed:
   ```bash
   sudo apt-get install -f
   ```
2. Check if libwebkit2gtk is installed:
   ```bash
   dpkg -l | grep webkit2gtk
   ```
3. Run from terminal to see errors:
   ```bash
   shopping-assistant
   ```

### Notifications Not Working

**Desktop App:**
1. Check system notification settings
2. Verify the app has permission to show notifications
3. Check **Settings** → **Notifications** in the app

**Discord:**
1. Verify webhook URL is correct
2. Test the webhook
3. Check Discord channel permissions

### Watchers Not Updating

1. **Desktop App**: Ensure the app is running (check system tray)
2. Check your internet connection
3. Verify the product URL is accessible
4. Check if the website has changed its structure

### Login Issues

**"Invalid credentials"**
- Double-check your email and password
- Use **"Forgot Password"** to reset

**"Device not recognized"**
- Desktop app may need to re-register the device
- Log out and log in again

**"Subscription expired"**
- Renew your subscription in **Billing** settings
- Basic plan users: Ensure you're using the desktop app

### Connection Errors

**"Cannot connect to server"**
1. Check your internet connection
2. Verify firewall isn't blocking the app
3. Try again in a few minutes (server may be down)

### Product Not Found / Parsing Error

- Some websites may not be supported
- Try a different product URL from the same store
- Report the issue to support with the URL

---

## Getting Help

### Support Resources

- **FAQ**: Check the website FAQ for common questions
- **Email Support**: Contact support (Pro plan)
- **GitHub Issues**: Report bugs or request features

### Reporting Issues

When reporting problems, include:
1. Your operating system (Windows/Linux version)
2. App version (Settings → About)
3. Steps to reproduce the issue
4. Any error messages
5. Product URL (if relevant)

---

## Tips and Best Practices

### Efficient Monitoring

1. **Prioritize products**: Monitor items you're most interested in
2. **Set realistic rules**: Use specific price targets rather than "any change"
3. **Check regularly**: Review alerts and update watchers as needed

### Notification Management

1. **Use Discord channels**: Create a dedicated #deals channel
2. **Set up filters**: Configure alert types per webhook
3. **Don't over-monitor**: Too many alerts can lead to notification fatigue

### Privacy and Security

1. **Strong password**: Use a unique, strong password
2. **Check URLs**: Only add URLs from trusted websites
3. **Logout when done**: Especially on shared computers
4. **Keep app updated**: Install updates for security fixes

---

## Keyboard Shortcuts

### Desktop App

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | New watcher |
| `Ctrl/Cmd + R` | Refresh |
| `Ctrl/Cmd + ,` | Settings |
| `Esc` | Close modal/dialog |

### Web App

| Shortcut | Action |
|----------|--------|
| `G then W` | Go to Watchers |
| `G then A` | Go to Alerts |
| `G then S` | Go to Settings |
| `?` | Show shortcuts help |
