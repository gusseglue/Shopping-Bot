import { PrismaClient, AlertType, WatcherStatus } from '@prisma/client'
import { Logger } from 'pino'
import { ThrottleManager } from './throttle-manager'
import { BaseAdapter, AdapterResult } from '../adapters/base.adapter'
import { ExampleAdapter } from '../adapters/example.adapter'
import { GenericAdapter } from '../adapters/generic.adapter'

interface WatcherRules {
  priceThreshold?: {
    type: 'below' | 'above' | 'change'
    value?: number
    percentage?: number
  }
  stockStatus?: boolean
  sizeAvailability?: string[]
  customSelector?: string
}

interface ProcessResult {
  success: boolean
  alerts: Array<{
    type: string
    data: object
  }>
  data?: object
  error?: string
}

/**
 * Processes watcher jobs by fetching product pages and checking rules
 */
export class WatcherProcessor {
  private prisma: PrismaClient
  private throttleManager: ThrottleManager
  private logger: Logger
  private adapters: Map<string, BaseAdapter>
  private etagCache: Map<string, string> = new Map()

  constructor(
    prisma: PrismaClient,
    throttleManager: ThrottleManager,
    logger: Logger
  ) {
    this.prisma = prisma
    this.throttleManager = throttleManager
    this.logger = logger.child({ service: 'watcher-processor' })

    // Register adapters
    this.adapters = new Map()
    this.adapters.set('example.com', new ExampleAdapter())
    // Add more adapters here as needed
  }

  /**
   * Process a watcher by ID
   */
  async process(watcherId: string): Promise<ProcessResult> {
    // Get watcher
    const watcher = await this.prisma.watcher.findUnique({
      where: { id: watcherId },
      include: {
        user: {
          include: {
            webhookConfigs: {
              where: { enabled: true },
            },
          },
        },
      },
    })

    if (!watcher) {
      return { success: false, alerts: [], error: 'Watcher not found' }
    }

    if (watcher.status !== WatcherStatus.ACTIVE) {
      return { success: false, alerts: [], error: 'Watcher is not active' }
    }

    const rules = watcher.rules as WatcherRules

    try {
      // Wait for throttle slot
      await this.throttleManager.waitForSlot(watcher.domain)

      // Fetch the page
      const fetchResult = await this.fetchPage(watcher.url, watcher.domain)

      if (!fetchResult.success) {
        await this.throttleManager.recordError(watcher.domain)
        await this.updateWatcherError(watcherId)
        return { success: false, alerts: [], error: fetchResult.error }
      }

      // Parse the page using appropriate adapter
      const adapter = this.getAdapter(watcher.domain)
      const html = fetchResult.html ?? ''
      
      // Skip parsing if we got a 304 Not Modified (empty html)
      if (!html) {
        await this.throttleManager.recordSuccess(watcher.domain)
        return { success: true, alerts: [], data: {} }
      }
      
      const parseResult = adapter.parse(html, watcher.url)

      if (!parseResult.success) {
        await this.throttleManager.recordError(watcher.domain)
        await this.updateWatcherError(watcherId)
        return { success: false, alerts: [], error: parseResult.error }
      }

      // Record success
      await this.throttleManager.recordSuccess(watcher.domain)

      // Check rules and create alerts
      const alerts = this.checkRules(rules, parseResult, watcher.lastResult as AdapterResult | null)

      // Create alerts in database
      for (const alert of alerts) {
        await this.createAlert(watcherId, watcher.userId, alert.type, alert.data)
      }

      // Update watcher
      await this.prisma.watcher.update({
        where: { id: watcherId },
        data: {
          lastCheckAt: new Date(),
          lastResult: parseResult as object,
          errorCount: 0,
          ...(alerts.length > 0 && { lastAlertAt: new Date() }),
        },
      })

      return {
        success: true,
        alerts,
        data: parseResult,
      }
    } catch (error) {
      this.logger.error({ watcherId, error }, 'Error processing watcher')
      await this.throttleManager.recordError(watcher.domain)
      await this.updateWatcherError(watcherId)
      return {
        success: false,
        alerts: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Fetch a page with conditional request support
   */
  private async fetchPage(
    url: string,
    _domain: string
  ): Promise<{ success: boolean; html?: string; error?: string }> {
    try {
      const headers: Record<string, string> = {
        'User-Agent': 'ShoppingAssistant/1.0 (Product Monitoring)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      }

      // Add ETag if we have one cached
      const cachedEtag = this.etagCache.get(url)
      if (cachedEtag) {
        headers['If-None-Match'] = cachedEtag
      }

      const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      // Handle 304 Not Modified
      if (response.status === 304) {
        this.logger.debug({ url }, 'Page not modified (304)')
        return { success: true, html: '' } // Empty means no changes
      }

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}` }
      }

      // Cache ETag for future requests
      const etag = response.headers.get('etag')
      if (etag) {
        this.etagCache.set(url, etag)
      }

      const html = await response.text()
      return { success: true, html }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Fetch failed',
      }
    }
  }

  /**
   * Get the appropriate adapter for a domain
   */
  private getAdapter(domain: string): BaseAdapter {
    const adapter = this.adapters.get(domain)
    if (adapter) return adapter

    // Try to find a wildcard match
    for (const [key, adapter] of this.adapters) {
      if (key.startsWith('*.') && domain.endsWith(key.slice(1))) {
        return adapter
      }
    }

    // Fall back to generic adapter
    return new GenericAdapter()
  }

  /**
   * Check rules against parse result
   */
  private checkRules(
    rules: WatcherRules,
    current: AdapterResult,
    previous: AdapterResult | null
  ): Array<{ type: string; data: object }> {
    const alerts: Array<{ type: string; data: object }> = []

    // Check price threshold
    if (rules.priceThreshold && current.price !== undefined) {
      const priceAlert = this.checkPriceRule(
        rules.priceThreshold,
        current.price,
        previous?.price
      )
      if (priceAlert) {
        alerts.push({
          type: 'PRICE_CHANGE',
          data: {
            productName: current.title || 'Unknown Product',
            productUrl: current.url,
            previousValue: previous?.price,
            currentValue: current.price,
            message: priceAlert.message,
          },
        })
      }
    }

    // Check stock status
    if (rules.stockStatus && current.inStock !== undefined) {
      if (current.inStock && previous && !previous.inStock) {
        alerts.push({
          type: 'BACK_IN_STOCK',
          data: {
            productName: current.title || 'Unknown Product',
            productUrl: current.url,
            message: 'Product is back in stock!',
          },
        })
      }
    }

    // Check size availability
    if (rules.sizeAvailability && current.sizes) {
      const newSizes = this.checkSizeAvailability(
        rules.sizeAvailability,
        current.sizes,
        previous?.sizes
      )
      for (const size of newSizes) {
        alerts.push({
          type: 'SIZE_AVAILABLE',
          data: {
            productName: current.title || 'Unknown Product',
            productUrl: current.url,
            currentValue: size,
            message: `Size ${size} is now available!`,
          },
        })
      }
    }

    return alerts
  }

  /**
   * Check price rule
   */
  private checkPriceRule(
    rule: WatcherRules['priceThreshold'],
    currentPrice: number,
    previousPrice?: number
  ): { message: string } | null {
    if (!rule) return null

    switch (rule.type) {
      case 'below':
        if (rule.value && currentPrice < rule.value) {
          return { message: `Price dropped below ${rule.value}!` }
        }
        break

      case 'above':
        if (rule.value && currentPrice > rule.value) {
          return { message: `Price is now above ${rule.value}!` }
        }
        break

      case 'change':
        if (previousPrice !== undefined && currentPrice !== previousPrice) {
          const change = ((currentPrice - previousPrice) / previousPrice) * 100
          if (rule.percentage && Math.abs(change) >= rule.percentage) {
            const direction = change < 0 ? 'dropped' : 'increased'
            return {
              message: `Price ${direction} by ${Math.abs(change).toFixed(1)}%!`,
            }
          } else if (!rule.percentage) {
            const direction = currentPrice < previousPrice ? 'dropped' : 'increased'
            return {
              message: `Price ${direction} from ${previousPrice} to ${currentPrice}`,
            }
          }
        }
        break
    }

    return null
  }

  /**
   * Check for newly available sizes
   */
  private checkSizeAvailability(
    watchedSizes: string[],
    currentSizes: string[],
    previousSizes?: string[]
  ): string[] {
    const previous = previousSizes || []
    const newlyAvailable: string[] = []

    for (const size of watchedSizes) {
      if (currentSizes.includes(size) && !previous.includes(size)) {
        newlyAvailable.push(size)
      }
    }

    return newlyAvailable
  }

  /**
   * Create an alert in the database
   */
  private async createAlert(
    watcherId: string,
    userId: string,
    type: string,
    data: object
  ) {
    await this.prisma.alert.create({
      data: {
        watcherId,
        userId,
        type: type as AlertType,
        data,
      },
    })
  }

  /**
   * Update watcher error count
   */
  private async updateWatcherError(watcherId: string) {
    const watcher = await this.prisma.watcher.findUnique({
      where: { id: watcherId },
    })

    if (!watcher) return

    const newErrorCount = watcher.errorCount + 1

    await this.prisma.watcher.update({
      where: { id: watcherId },
      data: {
        lastCheckAt: new Date(),
        errorCount: newErrorCount,
        ...(newErrorCount >= 5 && { status: WatcherStatus.ERROR }),
      },
    })
  }
}
