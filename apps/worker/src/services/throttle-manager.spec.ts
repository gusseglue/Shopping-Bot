import IORedis from 'ioredis'
import { ThrottleManager } from './throttle-manager'

// Mock IORedis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  }))
})

describe('ThrottleManager', () => {
  let throttleManager: ThrottleManager
  let mockRedis: jest.Mocked<IORedis>

  beforeEach(() => {
    jest.clearAllMocks()
    mockRedis = new IORedis() as jest.Mocked<IORedis>
    throttleManager = new ThrottleManager(mockRedis, {
      minDelayMs: 5000,
      maxDelayMs: 300000,
      backoffMultiplier: 2,
    })
  })

  describe('getEntry', () => {
    it('should return null if no entry exists', async () => {
      mockRedis.get.mockResolvedValueOnce(null)

      const result = await throttleManager.getEntry('example.com')

      expect(result).toBeNull()
      expect(mockRedis.get).toHaveBeenCalledWith('throttle:example.com')
    })

    it('should return parsed entry if exists', async () => {
      const entry = { lastRequest: Date.now(), errorCount: 2 }
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(entry))

      const result = await throttleManager.getEntry('example.com')

      expect(result).toEqual(entry)
    })
  })

  describe('updateEntry', () => {
    it('should store entry in Redis with expiry', async () => {
      const entry = { lastRequest: Date.now(), errorCount: 0 }

      await throttleManager.updateEntry('example.com', entry)

      expect(mockRedis.set).toHaveBeenCalledWith(
        'throttle:example.com',
        JSON.stringify(entry),
        'EX',
        3600
      )
    })
  })

  describe('canRequest', () => {
    it('should return 0 if no previous requests', async () => {
      mockRedis.get.mockResolvedValueOnce(null)

      const result = await throttleManager.canRequest('example.com')

      expect(result).toBe(0)
    })

    it('should return 0 if enough time has passed', async () => {
      const entry = {
        lastRequest: Date.now() - 10000, // 10 seconds ago
        errorCount: 0,
      }
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(entry))

      const result = await throttleManager.canRequest('example.com')

      expect(result).toBe(0)
    })

    it('should return wait time if not enough time has passed', async () => {
      const entry = {
        lastRequest: Date.now() - 2000, // 2 seconds ago
        errorCount: 0,
      }
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(entry))

      const result = await throttleManager.canRequest('example.com')

      // Should need to wait ~3 more seconds (5000 - 2000)
      expect(result).toBeGreaterThan(2000)
      expect(result).toBeLessThanOrEqual(3000)
    })

    it('should apply exponential backoff on errors', async () => {
      const entry = {
        lastRequest: Date.now() - 5000, // 5 seconds ago
        errorCount: 3,
      }
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(entry))

      const result = await throttleManager.canRequest('example.com')

      // With 3 errors and multiplier of 2: 5000 * 2^3 = 40000ms
      // Time passed: 5000ms
      // Wait time: 40000 - 5000 = 35000ms
      expect(result).toBeGreaterThan(30000)
    })
  })

  describe('recordSuccess', () => {
    it('should reset error count on success', async () => {
      await throttleManager.recordSuccess('example.com')

      expect(mockRedis.set).toHaveBeenCalledWith(
        'throttle:example.com',
        expect.stringContaining('"errorCount":0'),
        'EX',
        3600
      )
    })
  })

  describe('recordError', () => {
    it('should increment error count', async () => {
      const entry = { lastRequest: Date.now() - 10000, errorCount: 2 }
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(entry))

      await throttleManager.recordError('example.com')

      expect(mockRedis.set).toHaveBeenCalledWith(
        'throttle:example.com',
        expect.stringContaining('"errorCount":3'),
        'EX',
        3600
      )
    })

    it('should cap error count at 10', async () => {
      const entry = { lastRequest: Date.now() - 10000, errorCount: 10 }
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(entry))

      await throttleManager.recordError('example.com')

      expect(mockRedis.set).toHaveBeenCalledWith(
        'throttle:example.com',
        expect.stringContaining('"errorCount":10'),
        'EX',
        3600
      )
    })

    it('should start error count at 1 if no previous entry', async () => {
      mockRedis.get.mockResolvedValueOnce(null)

      await throttleManager.recordError('example.com')

      expect(mockRedis.set).toHaveBeenCalledWith(
        'throttle:example.com',
        expect.stringContaining('"errorCount":1'),
        'EX',
        3600
      )
    })
  })

  describe('getCurrentDelay', () => {
    it('should return minimum delay for no errors', async () => {
      const entry = { lastRequest: Date.now(), errorCount: 0 }
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(entry))

      const result = await throttleManager.getCurrentDelay('example.com')

      expect(result).toBe(5000)
    })

    it('should return minimum delay if no entry', async () => {
      mockRedis.get.mockResolvedValueOnce(null)

      const result = await throttleManager.getCurrentDelay('example.com')

      expect(result).toBe(5000)
    })

    it('should calculate exponential delay for errors', async () => {
      const entry = { lastRequest: Date.now(), errorCount: 2 }
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(entry))

      const result = await throttleManager.getCurrentDelay('example.com')

      // 5000 * 2^2 = 20000
      expect(result).toBe(20000)
    })

    it('should cap delay at maximum', async () => {
      const entry = { lastRequest: Date.now(), errorCount: 10 }
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(entry))

      const result = await throttleManager.getCurrentDelay('example.com')

      // Should be capped at maxDelayMs (300000)
      expect(result).toBe(300000)
    })
  })

  describe('reset', () => {
    it('should delete throttle entry', async () => {
      await throttleManager.reset('example.com')

      expect(mockRedis.del).toHaveBeenCalledWith('throttle:example.com')
    })
  })
})
