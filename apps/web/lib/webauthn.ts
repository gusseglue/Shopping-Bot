import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from '@simplewebauthn/browser'
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface WebAuthnStartResponse {
  challengeId: string
  options: PublicKeyCredentialCreationOptionsJSON | PublicKeyCredentialRequestOptionsJSON
}

interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: {
    id: string
    email: string
    name: string | null
    role: string
    plan: string
  }
}

interface Passkey {
  id: string
  name: string | null
  credentialDeviceType: string
  createdAt: string
  lastUsedAt: string | null
}

/**
 * Check if WebAuthn is supported in this browser
 */
export function isWebAuthnSupported(): boolean {
  return browserSupportsWebAuthn()
}

/**
 * Check if platform authenticator (e.g., Touch ID, Face ID, Windows Hello) is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  return platformAuthenticatorIsAvailable()
}

/**
 * Register a new account using a passkey
 */
export async function registerWithPasskey(
  email: string,
  name?: string,
  passkeyName?: string
): Promise<AuthResponse> {
  // 1. Start registration - get challenge from server
  const startResponse = await fetch(`${API_BASE_URL}/auth/webauthn/register/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name }),
  })

  if (!startResponse.ok) {
    const error = await startResponse.json()
    throw new Error(error.message || 'Failed to start registration')
  }

  const startData: WebAuthnStartResponse = await startResponse.json()

  // 2. Create credential with browser WebAuthn API
  let credential: RegistrationResponseJSON
  try {
    credential = await startRegistration({
      optionsJSON: startData.options as PublicKeyCredentialCreationOptionsJSON,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Passkey registration was cancelled or denied')
      }
      if (error.name === 'InvalidStateError') {
        throw new Error('A passkey already exists for this device')
      }
      throw new Error(`Passkey creation failed: ${error.message}`)
    }
    throw new Error('Passkey creation failed')
  }

  // 3. Finish registration - send credential to server
  const finishResponse = await fetch(`${API_BASE_URL}/auth/webauthn/register/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeId: startData.challengeId,
      credential,
      passkeyName,
    }),
  })

  if (!finishResponse.ok) {
    const error = await finishResponse.json()
    throw new Error(error.message || 'Failed to complete registration')
  }

  return finishResponse.json()
}

/**
 * Login with a passkey
 */
export async function loginWithPasskey(email: string): Promise<AuthResponse> {
  // 1. Start authentication - get challenge from server
  const startResponse = await fetch(`${API_BASE_URL}/auth/webauthn/login/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  if (!startResponse.ok) {
    const error = await startResponse.json()
    throw new Error(error.message || 'Failed to start authentication')
  }

  const startData: WebAuthnStartResponse = await startResponse.json()

  // 2. Get credential from browser WebAuthn API
  let credential: AuthenticationResponseJSON
  try {
    credential = await startAuthentication({
      optionsJSON: startData.options as PublicKeyCredentialRequestOptionsJSON,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Passkey authentication was cancelled or denied')
      }
      throw new Error(`Passkey authentication failed: ${error.message}`)
    }
    throw new Error('Passkey authentication failed')
  }

  // 3. Finish authentication - send credential to server
  const finishResponse = await fetch(`${API_BASE_URL}/auth/webauthn/login/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      challengeId: startData.challengeId,
      credential,
    }),
  })

  if (!finishResponse.ok) {
    const error = await finishResponse.json()
    throw new Error(error.message || 'Failed to complete authentication')
  }

  return finishResponse.json()
}

/**
 * Add a new passkey to an existing account
 */
export async function addPasskey(
  accessToken: string,
  passkeyName?: string
): Promise<Passkey> {
  // 1. Start add passkey - get challenge from server
  const startResponse = await fetch(`${API_BASE_URL}/auth/passkeys/add/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  if (!startResponse.ok) {
    const error = await startResponse.json()
    throw new Error(error.message || 'Failed to start passkey addition')
  }

  const startData: WebAuthnStartResponse = await startResponse.json()

  // 2. Create credential with browser WebAuthn API
  let credential: RegistrationResponseJSON
  try {
    credential = await startRegistration({
      optionsJSON: startData.options as PublicKeyCredentialCreationOptionsJSON,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Passkey registration was cancelled or denied')
      }
      if (error.name === 'InvalidStateError') {
        throw new Error('A passkey already exists for this device')
      }
      throw new Error(`Passkey creation failed: ${error.message}`)
    }
    throw new Error('Passkey creation failed')
  }

  // 3. Finish add passkey - send credential to server
  const finishResponse = await fetch(`${API_BASE_URL}/auth/passkeys/add/finish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      challengeId: startData.challengeId,
      credential,
      passkeyName,
    }),
  })

  if (!finishResponse.ok) {
    const error = await finishResponse.json()
    throw new Error(error.message || 'Failed to complete passkey addition')
  }

  return finishResponse.json()
}

/**
 * Get all passkeys for the current user
 */
export async function getPasskeys(accessToken: string): Promise<Passkey[]> {
  const response = await fetch(`${API_BASE_URL}/auth/passkeys`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch passkeys')
  }

  return response.json()
}

/**
 * Rename a passkey
 */
export async function renamePasskey(
  accessToken: string,
  passkeyId: string,
  name: string
): Promise<Passkey> {
  const response = await fetch(`${API_BASE_URL}/auth/passkeys/${passkeyId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to rename passkey')
  }

  return response.json()
}

/**
 * Delete a passkey
 */
export async function deletePasskey(
  accessToken: string,
  passkeyId: string
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/auth/passkeys/${passkeyId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to delete passkey')
  }

  return response.json()
}
