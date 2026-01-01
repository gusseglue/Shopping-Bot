# Shopping Assistant Desktop App

A native desktop application built with Tauri for local product monitoring and notifications.

## ⚠️ Important Disclaimer

This application is designed for **monitoring and notifications only**. It does NOT:
- Automatically complete purchases
- Bypass queue systems, captchas, or bot detection
- Circumvent rate limits or website protections

## Features

- **Local Monitoring**: Run product watchers on your own machine
- **System Notifications**: Native desktop notifications when alerts trigger
- **Discord Webhooks**: Send alerts to Discord channels
- **Secure Storage**: Credentials stored in OS keychain
- **Subscription Verification**: Validates license on startup
- **Polite Polling**: Per-domain throttling and exponential backoff

## Prerequisites

- Node.js 20+
- Rust 1.70+ (for Tauri)
- System dependencies for Tauri:
  - **Windows**: WebView2 (usually pre-installed on Windows 11)
  - **macOS**: Xcode Command Line Tools
  - **Linux**: `libgtk-3-dev`, `libwebkit2gtk-4.0-dev`, `libappindicator3-dev`, `librsvg2-dev`

## Installation

### Development Setup

1. **Install system dependencies**

   **Ubuntu/Debian:**
   ```bash
   sudo apt-get update
   sudo apt-get install libgtk-3-dev libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev
   ```

   **macOS:**
   ```bash
   xcode-select --install
   ```

   **Windows:**
   - Install [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (if not present)

2. **Install Rust**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

3. **Install dependencies**
   ```bash
   cd apps/desktop
   npm install
   ```

4. **Run in development mode**
   ```bash
   npm run tauri dev
   ```

## Building for Production

```bash
# Build for current platform
npm run tauri build
```

Binaries will be created in `src-tauri/target/release/bundle/`.

## Environment Variables

Create a `.env` file in the `apps/desktop` directory:

```env
VITE_API_URL=http://localhost:3001
```

## Architecture

```
apps/desktop/
├── src/                    # React frontend
│   ├── App.tsx             # Main application component
│   ├── components/
│   │   ├── LoginForm.tsx   # Authentication UI
│   │   └── Dashboard.tsx   # Watchers and alerts UI
│   └── main.tsx            # Entry point
├── src-tauri/              # Rust backend
│   ├── src/
│   │   └── main.rs         # Tauri commands and app logic
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
└── package.json
```

## Security Features

### Secure Credential Storage

The app uses the OS keychain for storing sensitive data:
- **Windows**: Windows Credential Manager
- **macOS**: Keychain
- **Linux**: Secret Service (GNOME Keyring, KWallet)

### Device Binding

- Tokens are bound to a unique device fingerprint
- Device must be registered on first login
- Refresh tokens are device-specific

### Subscription Verification

On each startup, the app:
1. Calls `/auth/verify` to validate the user session
2. Checks subscription status
3. Disables monitoring if subscription is invalid

## Development

### Frontend (React + Vite)

```bash
# Run frontend only
npm run dev
```

### Tauri Commands

The app exposes several Tauri commands in `src-tauri/src/main.rs`:

- `login` - Authenticate and store tokens
- `logout` - Clear stored credentials
- `get_stored_credentials` - Retrieve tokens from keychain
- `start_watcher` - Begin monitoring a product
- `stop_watcher` - Stop monitoring
- `send_notification` - Trigger system notification
- `verify_subscription` - Check subscription status

### Adding a New Command

1. Define the command in `src-tauri/src/main.rs`:
   ```rust
   #[tauri::command]
   fn my_command(param: String) -> Result<String, String> {
       Ok(format!("Received: {}", param))
   }
   ```

2. Register in the handler:
   ```rust
   tauri::Builder::default()
       .invoke_handler(tauri::generate_handler![my_command])
   ```

3. Call from React:
   ```typescript
   import { invoke } from '@tauri-apps/api/tauri';
   
   const result = await invoke('my_command', { param: 'value' });
   ```

## Troubleshooting

### WebView Issues on Linux

If you encounter WebView errors on Linux:
```bash
sudo apt-get install libwebkit2gtk-4.0-dev
```

### Keychain Access Errors

Make sure your system's keychain service is running:
- **Linux**: `secret-tool` or GNOME Keyring must be available
- **macOS**: Keychain Access should be unlocked

### Build Failures

1. Ensure Rust is up to date:
   ```bash
   rustup update
   ```

2. Clear build cache:
   ```bash
   cd src-tauri
   cargo clean
   ```

## v2 Roadmap

- [ ] Code-signed builds for Windows and macOS
- [ ] Auto-update system
- [ ] System tray with quick actions
- [ ] Multiple profile support
- [ ] Import/export watcher configurations
- [ ] Browser extension integration

## License

MIT License - see [LICENSE](../../LICENSE) for details.
