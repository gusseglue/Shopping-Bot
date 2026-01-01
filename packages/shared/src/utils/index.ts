/**
 * Formats a date to ISO string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString()
}

/**
 * Formats a date for display
 */
export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formats a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  
  return formatDisplayDate(d)
}

/**
 * Validates and normalizes a URL
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Remove trailing slash
    let normalized = `${parsed.protocol}//${parsed.host}${parsed.pathname}`
    if (normalized.endsWith('/') && parsed.pathname !== '/') {
      normalized = normalized.slice(0, -1)
    }
    // Add query params if present
    if (parsed.search) {
      normalized += parsed.search
    }
    return normalized
  } catch {
    return url
  }
}

/**
 * Extracts domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname
  } catch {
    return ''
  }
}

/**
 * Checks if a domain is in the allowed list
 */
export function isDomainAllowed(url: string, allowedDomains: string[]): boolean {
  const domain = extractDomain(url)
  if (!domain) return false
  
  return allowedDomains.some(allowed => {
    // Support wildcard subdomains
    if (allowed.startsWith('*.')) {
      const baseDomain = allowed.slice(2)
      return domain === baseDomain || domain.endsWith(`.${baseDomain}`)
    }
    return domain === allowed
  })
}

/**
 * Creates a throttle function
 */
export function createThrottle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return ((...args: Parameters<T>) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCall

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    if (timeSinceLastCall >= delayMs) {
      lastCall = now
      return Promise.resolve(fn(...args) as ReturnType<T>)
    }

    return new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        resolve(fn(...args) as ReturnType<T>)
      }, delayMs - timeSinceLastCall)
    })
  })
}

/**
 * Calculates exponential backoff delay
 */
export function calculateBackoff(
  attempt: number,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 300000 // 5 minutes
): number {
  const delay = baseDelayMs * Math.pow(2, attempt)
  return Math.min(delay, maxDelayMs)
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generates a random string for tokens/IDs
 */
export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Safely parses JSON
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

/**
 * Truncates text to specified length
 */
export function truncate(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - suffix.length) + suffix
}

/**
 * Formats price with currency
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price)
}

/**
 * Extracts price from text
 */
export function extractPrice(text: string): number | null {
  // Match common price patterns
  const patterns = [
    /\$[\d,]+\.?\d*/,
    /USD\s*[\d,]+\.?\d*/,
    /€[\d,]+\.?\d*/,
    /EUR\s*[\d,]+\.?\d*/,
    /£[\d,]+\.?\d*/,
    /GBP\s*[\d,]+\.?\d*/,
    /[\d,]+\.?\d*\s*(USD|EUR|GBP|DKK|SEK|NOK)/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const priceStr = match[0].replace(/[^\d.]/g, '')
      const price = parseFloat(priceStr)
      if (!isNaN(price)) return price
    }
  }

  return null
}

/**
 * Masks sensitive data
 */
export function maskSensitive(value: string, visibleChars: number = 4): string {
  if (value.length <= visibleChars) return '*'.repeat(value.length)
  const visible = value.slice(-visibleChars)
  return '*'.repeat(value.length - visibleChars) + visible
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
    }, delayMs)
  }
}
