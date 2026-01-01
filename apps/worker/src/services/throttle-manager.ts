import IORedis from 'ioredis'

interface ThrottleEntry {
  lastRequest: number
  errorCount: number
}

/**
 * Manages per-domain throttling and exponential backoff
 * Implements polite monitoring as required by constraints
 */
export class ThrottleManager {
  private redis: IORedis
  private readonly minDelayMs: number
  private readonly maxDelayMs: number
  private readonly backoffMultiplier: number
  private readonly keyPrefix = 'throttle:'

  constructor(
    redis: IORedis,
    options: {
      minDelayMs?: number
      maxDelayMs?: number
      backoffMultiplier?: number
    } = {}
  ) {
    this.redis = redis
    this.minDelayMs = options.minDelayMs || 5000 // 5 seconds minimum
    this.maxDelayMs = options.maxDelayMs || 300000 // 5 minutes maximum
    this.backoffMultiplier = options.backoffMultiplier || 2
  }

  /**
   * Get the throttle entry for a domain
   */
  async getEntry(domain: string): Promise<ThrottleEntry | null> {
    const data = await this.redis.get(this.keyPrefix + domain)
    if (!data) return null
    return JSON.parse(data)
  }

  /**
   * Update the throttle entry for a domain
   */
  async updateEntry(domain: string, entry: ThrottleEntry): Promise<void> {
    await this.redis.set(
      this.keyPrefix + domain,
      JSON.stringify(entry),
      'EX',
      3600 // Expire after 1 hour of inactivity
    )
  }

  /**
   * Check if we can make a request to the domain
   * Returns the wait time in milliseconds if we need to wait, or 0 if we can proceed
   */
  async canRequest(domain: string): Promise<number> {
    const entry = await this.getEntry(domain)
    
    if (!entry) {
      return 0 // No previous requests, can proceed
    }

    const now = Date.now()
    const timeSinceLastRequest = now - entry.lastRequest
    const requiredDelay = this.calculateDelay(entry.errorCount)

    if (timeSinceLastRequest >= requiredDelay) {
      return 0 // Enough time has passed
    }

    return requiredDelay - timeSinceLastRequest
  }

  /**
   * Wait until we can make a request to the domain
   */
  async waitForSlot(domain: string): Promise<void> {
    const waitTime = await this.canRequest(domain)
    
    if (waitTime > 0) {
      await this.sleep(waitTime)
    }
  }

  /**
   * Record a successful request
   */
  async recordSuccess(domain: string): Promise<void> {
    await this.updateEntry(domain, {
      lastRequest: Date.now(),
      errorCount: 0,
    })
  }

  /**
   * Record a failed request
   */
  async recordError(domain: string): Promise<void> {
    const entry = await this.getEntry(domain)
    const currentErrorCount = entry?.errorCount || 0

    await this.updateEntry(domain, {
      lastRequest: Date.now(),
      errorCount: Math.min(currentErrorCount + 1, 10), // Cap at 10 errors
    })
  }

  /**
   * Calculate delay based on error count (exponential backoff)
   */
  private calculateDelay(errorCount: number): number {
    if (errorCount === 0) {
      return this.minDelayMs
    }

    const delay = this.minDelayMs * Math.pow(this.backoffMultiplier, errorCount)
    return Math.min(delay, this.maxDelayMs)
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get current delay for a domain (for logging/monitoring)
   */
  async getCurrentDelay(domain: string): Promise<number> {
    const entry = await this.getEntry(domain)
    if (!entry) return this.minDelayMs
    return this.calculateDelay(entry.errorCount)
  }

  /**
   * Reset throttle for a domain
   */
  async reset(domain: string): Promise<void> {
    await this.redis.del(this.keyPrefix + domain)
  }
}
