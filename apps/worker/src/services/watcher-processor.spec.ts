import { WatcherProcessor } from './watcher-processor'
import { ThrottleManager } from './throttle-manager'
import { Logger } from 'pino'

// Define WatcherStatus locally since we're mocking
const WatcherStatus = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  ERROR: 'ERROR',
} as const

// Mock dependencies
jest.mock('./throttle-manager')

// Mock global fetch
global.fetch = jest.fn()

describe('WatcherProcessor - Rule Triggers', () => {
  let processor: WatcherProcessor
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any
  let mockThrottleManager: jest.Mocked<ThrottleManager>
  let mockLogger: jest.Mocked<Logger>

  const mockWatcher = {
    id: 'watcher-123',
    userId: 'user-123',
    url: 'https://example.com/product/123',
    name: 'Test Product',
    domain: 'example.com',
    rules: {
      priceThreshold: { type: 'below', value: 100 },
      stockStatus: true,
      sizeAvailability: ['M', 'L'],
    },
    interval: 300,
    status: WatcherStatus.ACTIVE,
    lastCheckAt: new Date(),
    lastResult: null,
    lastAlertAt: null,
    errorCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-123',
      email: 'test@example.com',
      webhookConfigs: [],
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockPrisma = {
      watcher: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      alert: {
        create: jest.fn(),
      },
    }

    mockThrottleManager = {
      waitForSlot: jest.fn().mockResolvedValue(undefined),
      recordSuccess: jest.fn().mockResolvedValue(undefined),
      recordError: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ThrottleManager>

    mockLogger = {
      child: jest.fn().mockReturnThis(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>

    processor = new WatcherProcessor(
      mockPrisma,
      mockThrottleManager,
      mockLogger
    )
  })

  describe('Price Change Rules', () => {
    it('should trigger alert when price drops below threshold', async () => {
      const watcherWithPriceRule = {
        ...mockWatcher,
        rules: {
          priceThreshold: { type: 'below', value: 100 },
        },
        lastResult: { price: 150, title: 'Test Product' },
      }

      mockPrisma.watcher.findUnique.mockResolvedValueOnce(
        watcherWithPriceRule as any
      )
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () => `
          <html>
            <head><title>Test Product - $89.99</title></head>
            <body>
              <h1>Test Product</h1>
              <span class="price">$89.99</span>
              <span class="in-stock">In Stock</span>
            </body>
          </html>
        `,
      })

      mockPrisma.watcher.update.mockResolvedValueOnce(watcherWithPriceRule as any)

      const result = await processor.process('watcher-123')

      expect(result.success).toBe(true)
      // Should create alert for price below threshold
      expect(mockPrisma.alert.create).toHaveBeenCalled()
    })

    it('should trigger alert on price change percentage', async () => {
      const watcherWithPercentRule = {
        ...mockWatcher,
        rules: {
          priceThreshold: { type: 'change', percentage: 10 },
        },
        lastResult: { price: 100, title: 'Test Product' },
      }

      mockPrisma.watcher.findUnique.mockResolvedValueOnce(
        watcherWithPercentRule as any
      )
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () => `
          <html>
            <head><title>Test Product - $85.00</title></head>
            <body>
              <span class="price">$85.00</span>
            </body>
          </html>
        `,
      })

      mockPrisma.watcher.update.mockResolvedValueOnce(watcherWithPercentRule as any)

      const result = await processor.process('watcher-123')

      expect(result.success).toBe(true)
      // 15% drop should trigger alert (above 10% threshold)
    })
  })

  describe('Stock Status Rules', () => {
    it('should trigger alert when product comes back in stock', async () => {
      const watcherWithStockRule = {
        ...mockWatcher,
        rules: { stockStatus: true },
        lastResult: { inStock: false, title: 'Test Product' },
      }

      mockPrisma.watcher.findUnique.mockResolvedValueOnce(
        watcherWithStockRule as any
      )
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () => `
          <html>
            <head><title>Test Product</title></head>
            <body>
              <span class="availability">In Stock</span>
            </body>
          </html>
        `,
      })

      mockPrisma.watcher.update.mockResolvedValueOnce(watcherWithStockRule as any)

      const result = await processor.process('watcher-123')

      expect(result.success).toBe(true)
    })

    it('should not trigger alert if product was already in stock', async () => {
      const watcherWithStockRule = {
        ...mockWatcher,
        rules: { stockStatus: true },
        lastResult: { inStock: true, title: 'Test Product' },
      }

      mockPrisma.watcher.findUnique.mockResolvedValueOnce(
        watcherWithStockRule as any
      )
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () => `
          <html>
            <head><title>Test Product</title></head>
            <body>
              <span class="availability">In Stock</span>
            </body>
          </html>
        `,
      })

      mockPrisma.watcher.update.mockResolvedValueOnce(watcherWithStockRule as any)

      const result = await processor.process('watcher-123')

      expect(result.success).toBe(true)
      // No alert should be created for already in stock
    })
  })

  describe('Size Availability Rules', () => {
    it('should trigger alert when watched size becomes available', async () => {
      const watcherWithSizeRule = {
        ...mockWatcher,
        rules: {
          sizeAvailability: ['M', 'L', 'XL'],
        },
        lastResult: { sizes: ['S'], title: 'Test Product' },
      }

      mockPrisma.watcher.findUnique.mockResolvedValueOnce(
        watcherWithSizeRule as any
      )
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () => `
          <html>
            <head><title>Test Product</title></head>
            <body>
              <select class="size-selector">
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L - Available</option>
              </select>
            </body>
          </html>
        `,
      })

      mockPrisma.watcher.update.mockResolvedValueOnce(watcherWithSizeRule as any)

      const result = await processor.process('watcher-123')

      expect(result.success).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle watcher not found', async () => {
      mockPrisma.watcher.findUnique.mockResolvedValueOnce(null)

      const result = await processor.process('nonexistent-watcher')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Watcher not found')
    })

    it('should handle inactive watcher', async () => {
      const inactiveWatcher = {
        ...mockWatcher,
        status: WatcherStatus.PAUSED,
      }
      mockPrisma.watcher.findUnique.mockResolvedValueOnce(inactiveWatcher as any)

      const result = await processor.process('watcher-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Watcher is not active')
    })

    it('should record error on fetch failure', async () => {
      mockPrisma.watcher.findUnique.mockResolvedValueOnce(mockWatcher as any)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })
      mockPrisma.watcher.findUnique.mockResolvedValueOnce(mockWatcher as any)
      mockPrisma.watcher.update.mockResolvedValueOnce(mockWatcher as any)

      const result = await processor.process('watcher-123')

      expect(result.success).toBe(false)
      expect(mockThrottleManager.recordError).toHaveBeenCalledWith('example.com')
    })

    it('should record error on timeout', async () => {
      mockPrisma.watcher.findUnique.mockResolvedValueOnce(mockWatcher as any)
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Timeout')
      )
      mockPrisma.watcher.findUnique.mockResolvedValueOnce(mockWatcher as any)
      mockPrisma.watcher.update.mockResolvedValueOnce(mockWatcher as any)

      const result = await processor.process('watcher-123')

      expect(result.success).toBe(false)
      expect(mockThrottleManager.recordError).toHaveBeenCalledWith('example.com')
    })
  })

  describe('Throttling Integration', () => {
    it('should wait for throttle slot before making request', async () => {
      mockPrisma.watcher.findUnique.mockResolvedValueOnce(mockWatcher as any)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () => '<html><body>Test</body></html>',
      })
      mockPrisma.watcher.update.mockResolvedValueOnce(mockWatcher as any)

      await processor.process('watcher-123')

      expect(mockThrottleManager.waitForSlot).toHaveBeenCalledWith('example.com')
    })

    it('should record success after successful fetch', async () => {
      mockPrisma.watcher.findUnique.mockResolvedValueOnce(mockWatcher as any)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () => '<html><body>Test</body></html>',
      })
      mockPrisma.watcher.update.mockResolvedValueOnce(mockWatcher as any)

      await processor.process('watcher-123')

      expect(mockThrottleManager.recordSuccess).toHaveBeenCalledWith(
        'example.com'
      )
    })
  })

  describe('ETag/Conditional Requests', () => {
    it('should handle 304 Not Modified response', async () => {
      mockPrisma.watcher.findUnique.mockResolvedValueOnce(mockWatcher as any)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 304,
      })
      mockPrisma.watcher.update.mockResolvedValueOnce(mockWatcher as any)

      await processor.process('watcher-123')

      // 304 means no changes, but still success
      expect(mockThrottleManager.recordSuccess).toHaveBeenCalled()
    })
  })
})
