// User Types
export interface User {
  id: string
  email: string
  name: string | null
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export type UserRole = 'user' | 'admin'

export interface UserProfile {
  id: string
  email: string
  name: string | null
  role: UserRole
  plan: PlanType
  createdAt: Date
}

// Device Types
export interface Device {
  id: string
  userId: string
  name: string
  fingerprint: string
  platform: DevicePlatform
  lastSeenAt: Date
  createdAt: Date
}

export type DevicePlatform = 'windows' | 'macos' | 'linux' | 'web'

// Passkey/Authenticator Types
export interface Passkey {
  id: string
  userId: string
  credentialId: string
  name: string | null
  credentialDeviceType: string
  credentialBackedUp: boolean
  transports: string[]
  createdAt: Date
  lastUsedAt: Date | null
}

export interface PasskeyInfo {
  id: string
  name: string | null
  credentialDeviceType: string
  createdAt: Date
  lastUsedAt: Date | null
}

// Subscription Types
export interface Subscription {
  id: string
  userId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  plan: PlanType
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  createdAt: Date
  updatedAt: Date
}

export type PlanType = 'free' | 'basic' | 'pro'

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'paused'
  | 'trialing'
  | 'unpaid'

// Watcher Types
export interface Watcher {
  id: string
  userId: string
  url: string
  name: string
  domain: string
  rules: WatcherRules
  interval: number // in seconds
  status: WatcherStatus
  lastCheckAt: Date | null
  lastAlertAt: Date | null
  errorCount: number
  createdAt: Date
  updatedAt: Date
}

export type WatcherStatus = 'active' | 'paused' | 'error' | 'disabled'

export interface WatcherRules {
  priceThreshold?: PriceRule
  stockStatus?: boolean
  sizeAvailability?: string[]
  customSelector?: string
}

export interface PriceRule {
  type: 'below' | 'above' | 'change'
  value?: number
  percentage?: number
}

// Alert Types
export interface Alert {
  id: string
  watcherId: string
  userId: string
  type: AlertType
  data: AlertData
  readAt: Date | null
  createdAt: Date
}

export type AlertType = 'price_change' | 'back_in_stock' | 'size_available' | 'error'

export interface AlertData {
  productName: string
  productUrl: string
  previousValue?: string | number
  currentValue?: string | number
  message?: string
}

// Webhook Types
export interface WebhookConfig {
  id: string
  userId: string
  type: WebhookType
  url: string // Encrypted in storage
  enabled: boolean
  lastTestedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type WebhookType = 'discord' | 'slack' | 'custom'

// Audit Log Types
export interface AuditLog {
  id: string
  userId: string
  action: AuditAction
  metadata: Record<string, unknown>
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

export type AuditAction =
  | 'login'
  | 'logout'
  | 'token_refresh'
  | 'device_registered'
  | 'device_revoked'
  | 'password_changed'
  | 'plan_changed'
  | 'watcher_created'
  | 'watcher_updated'
  | 'watcher_deleted'
  | 'webhook_created'
  | 'webhook_tested'
  | 'admin_action'
  | 'passkey_added'
  | 'passkey_deleted'
  | 'webauthn_register'

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ApiError
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Auth Types
export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface TokenPayload {
  sub: string // user id
  email: string
  role: UserRole
  deviceId?: string
  iat: number
  exp: number
}

export interface DeviceRegistrationPayload {
  name: string
  fingerprint: string
  platform: DevicePlatform
}

// Stripe Types
export interface StripeWebhookEvent {
  type: string
  data: {
    object: Record<string, unknown>
  }
}
