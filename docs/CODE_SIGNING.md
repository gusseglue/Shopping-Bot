# Desktop App Code Signing Guide

This guide explains how to set up code signing for the Shopping Assistant desktop application on Windows and macOS.

## Why Code Sign?

Code signing provides:
- **Trust**: Users can verify the software comes from you and hasn't been tampered with
- **Security**: Operating systems won't show scary warnings or block installation
- **Updates**: Enables secure auto-updates through Tauri's update system
- **App Store**: Required for distribution through Apple App Store or Microsoft Store

## Prerequisites

### Windows
- **Code Signing Certificate**: Obtain from a Certificate Authority (CA) like:
  - DigiCert
  - Sectigo (formerly Comodo)
  - SSL.com
  - GlobalSign
- **Extended Validation (EV) Certificate** is recommended for instant SmartScreen trust

### macOS
- **Apple Developer Account**: $99/year at [developer.apple.com](https://developer.apple.com)
- **Developer ID Application Certificate**: For distribution outside App Store
- **Notarization**: Required for macOS Catalina and later

## Setting Up Code Signing

### Windows Code Signing

1. **Purchase a Code Signing Certificate**
   - Recommended: EV (Extended Validation) certificate for SmartScreen trust
   - Standard OV (Organization Validation) works but may require reputation building

2. **Export Certificate as PFX**
   ```powershell
   # If certificate is in Windows Certificate Store
   $cert = Get-ChildItem -Path Cert:\CurrentUser\My\<THUMBPRINT>
   $password = ConvertTo-SecureString -String "your-password" -Force -AsPlainText
   Export-PfxCertificate -Cert $cert -FilePath "certificate.pfx" -Password $password
   ```

3. **Encode Certificate for GitHub Secrets**
   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("certificate.pfx"))
   ```

4. **Add GitHub Secrets**
   - `WINDOWS_CERTIFICATE`: Base64-encoded PFX file
   - `WINDOWS_CERTIFICATE_PASSWORD`: Password for the PFX file

5. **Update tauri.conf.json**
   ```json
   {
     "tauri": {
       "bundle": {
         "windows": {
           "certificateThumbprint": "YOUR_CERT_THUMBPRINT",
           "digestAlgorithm": "sha256",
           "timestampUrl": "http://timestamp.digicert.com"
         }
       }
     }
   }
   ```

### macOS Code Signing

1. **Create Developer ID Certificate**
   - Log in to [Apple Developer Portal](https://developer.apple.com)
   - Go to Certificates, IDs & Profiles
   - Create a "Developer ID Application" certificate

2. **Export Certificate as P12**
   ```bash
   # Open Keychain Access
   # Find your "Developer ID Application" certificate
   # Right-click → Export
   # Save as .p12 with a strong password
   ```

3. **Encode Certificate for GitHub Secrets**
   ```bash
   base64 -i certificate.p12 | tr -d '\n'
   ```

4. **Get Team ID**
   - Find in Apple Developer Portal under Membership

5. **Create App-Specific Password**
   - Go to [appleid.apple.com](https://appleid.apple.com)
   - Sign in → Security → App-Specific Passwords
   - Generate a password for notarization

6. **Add GitHub Secrets**
   - `APPLE_CERTIFICATE`: Base64-encoded P12 file
   - `APPLE_CERTIFICATE_PASSWORD`: Password for the P12 file
   - `APPLE_SIGNING_IDENTITY`: "Developer ID Application: Your Name (TEAM_ID)"
   - `APPLE_ID`: Your Apple ID email
   - `APPLE_PASSWORD`: App-specific password
   - `APPLE_TEAM_ID`: Your team ID
   - `KEYCHAIN_PASSWORD`: Any secure password for temporary keychain

### Tauri Updater Signing

For secure auto-updates, Tauri uses its own signing key:

1. **Generate Signing Keys**
   ```bash
   npx @tauri-apps/cli signer generate -w ~/.tauri/shopping-assistant.key
   ```

2. **Add GitHub Secrets**
   - `TAURI_SIGNING_PRIVATE_KEY`: Contents of the private key file
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: Password used during generation

3. **Add Public Key to tauri.conf.json**
   ```json
   {
     "tauri": {
       "updater": {
         "active": true,
         "pubkey": "YOUR_PUBLIC_KEY_HERE"
       }
     }
   }
   ```

## Verifying Signatures

### Windows
```powershell
# Check digital signature
Get-AuthenticodeSignature "ShoppingAssistant.msi"

# Or right-click → Properties → Digital Signatures
```

### macOS
```bash
# Verify code signature
codesign -dv --verbose=4 "/Applications/Shopping Assistant.app"

# Verify notarization
spctl -a -vv "/Applications/Shopping Assistant.app"

# Check entitlements
codesign -d --entitlements :- "/Applications/Shopping Assistant.app"
```

### Linux
Linux AppImages can be signed with GPG:
```bash
# Verify GPG signature
gpg --verify ShoppingAssistant.AppImage.sig ShoppingAssistant.AppImage
```

## Troubleshooting

### Windows SmartScreen Warning
- EV certificates have instant trust
- OV certificates need to build reputation (usually a few thousand downloads)
- Submit your app to Microsoft for reputation review

### macOS "App is damaged" Error
```bash
# This usually means notarization failed
# Check notarization status
xcrun notarytool history --apple-id YOUR_APPLE_ID --team-id YOUR_TEAM_ID

# Get detailed log for a specific submission
xcrun notarytool log SUBMISSION_ID --apple-id YOUR_APPLE_ID --team-id YOUR_TEAM_ID
```

### macOS Gatekeeper Blocks App
```bash
# Clear Gatekeeper cache (for testing)
sudo spctl --reset-default

# Check if app is quarantined
xattr -l "/Applications/Shopping Assistant.app"

# Remove quarantine (for testing only)
sudo xattr -rd com.apple.quarantine "/Applications/Shopping Assistant.app"
```

## Cost Summary

| Platform | Certificate Type | Approximate Cost | Renewal |
|----------|-----------------|------------------|---------|
| Windows | OV Code Signing | $100-300/year | Annual |
| Windows | EV Code Signing | $300-500/year | Annual |
| macOS | Developer Program | $99/year | Annual |

## Resources

- [Tauri Code Signing Guide](https://tauri.app/v1/guides/distribution/sign-macos)
- [Apple Developer Documentation](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Microsoft Authenticode](https://docs.microsoft.com/en-us/windows/win32/seccrypto/authenticode)
- [DigiCert Code Signing](https://www.digicert.com/signing/code-signing-certificates)
