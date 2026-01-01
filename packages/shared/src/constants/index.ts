import type { PlanType } from '../types'

/**
 * Plan limits configuration
 */
export const PLAN_LIMITS: Record<PlanType, {
  maxWatchers: number
  minInterval: number // in seconds
  maxApiCallsPerMinute: number
  serverSideMonitoring: boolean
}> = {
  free: {
    maxWatchers: 3,
    minInterval: 600, // 10 minutes
    maxApiCallsPerMinute: 10,
    serverSideMonitoring: false,
  },
  basic: {
    maxWatchers: 10,
    minInterval: 300, // 5 minutes
    maxApiCallsPerMinute: 30,
    serverSideMonitoring: false,
  },
  pro: {
    maxWatchers: 100,
    minInterval: 60, // 1 minute
    maxApiCallsPerMinute: 100,
    serverSideMonitoring: true,
  },
}

/**
 * Allowed domains for monitoring
 * Using wildcards for subdomains
 */
export const ALLOWED_DOMAINS = [
  // Demo/test domain
  'example.com',
  '*.example.com',
  
  // Common e-commerce platforms (examples - expand based on needs)
  'amazon.com',
  '*.amazon.com',
  'amazon.co.uk',
  '*.amazon.co.uk',
  'ebay.com',
  '*.ebay.com',
  'walmart.com',
  '*.walmart.com',
  'target.com',
  '*.target.com',
  'bestbuy.com',
  '*.bestbuy.com',
  'newegg.com',
  '*.newegg.com',
  
  // Nordic region
  'zalando.dk',
  '*.zalando.dk',
  'zalando.se',
  '*.zalando.se',
  'pricerunner.dk',
  '*.pricerunner.dk',
  
  // Sneakers & fashion
  'nike.com',
  '*.nike.com',
  'adidas.com',
  '*.adidas.com',
  'footlocker.com',
  '*.footlocker.com',
]

/**
 * Blocked domains that should never be monitored
 */
export const BLOCKED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '*.local',
  '*.internal',
]

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  // Per-domain throttling
  domainMinDelayMs: 5000, // 5 seconds minimum between requests to same domain
  domainMaxConcurrent: 2, // Max concurrent requests to same domain
  
  // Global limits
  globalMaxConcurrent: 10, // Max concurrent requests globally
  
  // Backoff configuration
  backoffBaseMs: 30000, // 30 seconds
  backoffMaxMs: 300000, // 5 minutes
  backoffMultiplier: 2,
  maxRetries: 5,
  
  // API rate limits
  loginAttemptsPerMinute: 5,
  apiCallsPerMinute: 60,
}

/**
 * Token configuration
 */
export const TOKEN_CONFIG = {
  accessTokenExpirySeconds: 900, // 15 minutes
  refreshTokenExpiryDays: 7,
  deviceTokenExpiryDays: 30,
}

/**
 * Error codes
 */
export const ERROR_CODES = {
  // Auth errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_DEVICE_NOT_REGISTERED: 'AUTH_DEVICE_NOT_REGISTERED',
  AUTH_DEVICE_REVOKED: 'AUTH_DEVICE_REVOKED',
  AUTH_SUBSCRIPTION_REQUIRED: 'AUTH_SUBSCRIPTION_REQUIRED',
  AUTH_SUBSCRIPTION_EXPIRED: 'AUTH_SUBSCRIPTION_EXPIRED',
  
  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_URL: 'INVALID_URL',
  DOMAIN_NOT_ALLOWED: 'DOMAIN_NOT_ALLOWED',
  DOMAIN_BLOCKED: 'DOMAIN_BLOCKED',
  
  // Plan limit errors
  WATCHER_LIMIT_REACHED: 'WATCHER_LIMIT_REACHED',
  INTERVAL_TOO_SHORT: 'INTERVAL_TOO_SHORT',
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE',
  
  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  
  // Rate limit errors
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  
  // Webhook errors
  WEBHOOK_DELIVERY_FAILED: 'WEBHOOK_DELIVERY_FAILED',
  WEBHOOK_INVALID_URL: 'WEBHOOK_INVALID_URL',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const

/**
 * Alert type labels
 */
export const ALERT_TYPE_LABELS = {
  price_change: 'Price Change',
  back_in_stock: 'Back in Stock',
  size_available: 'Size Available',
  error: 'Error',
} as const

/**
 * Watcher status labels
 */
export const WATCHER_STATUS_LABELS = {
  active: 'Active',
  paused: 'Paused',
  error: 'Error',
  disabled: 'Disabled',
} as const

/**
 * Plan display names
 */
export const PLAN_DISPLAY_NAMES: Record<PlanType, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
}

/**
 * Plan prices (in cents, for Stripe)
 */
export const PLAN_PRICES: Record<PlanType, number> = {
  free: 0,
  basic: 999, // $9.99
  pro: 2999, // $29.99
}

/**
 * Audit actions that require logging
 */
export const AUDIT_ACTIONS = [
  'login',
  'logout',
  'token_refresh',
  'device_registered',
  'device_revoked',
  'password_changed',
  'plan_changed',
  'watcher_created',
  'watcher_updated',
  'watcher_deleted',
  'webhook_created',
  'webhook_tested',
  'admin_action',
] as const

/**
 * Environment-specific constants
 * Note: These are safe for server-side code only
 * For browser code, use build-time environment variables
 */
export const getEnv = () => {
  // Only access process.env on the server
  if (typeof window === 'undefined') {
    return {
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',
      isTest: process.env.NODE_ENV === 'test',
    }
  }
  // Browser: default to production for safety
  return {
    isDevelopment: false,
    isProduction: true,
    isTest: false,
  }
}
