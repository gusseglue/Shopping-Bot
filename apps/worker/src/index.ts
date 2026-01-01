import { Queue, Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import pino from 'pino'

import { PrismaClient } from '@prisma/client'
import { ThrottleManager } from './services/throttle-manager'
import { WatcherProcessor } from './services/watcher-processor'
import { Scheduler } from './services/scheduler'

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
})

// Configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '5', 10)
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '30000', 10) // 30 seconds

async function main() {
  logger.info('Starting Shopping Assistant Worker...')

  // Initialize connections
  const redis = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
  })

  const prisma = new PrismaClient()

  // Initialize services
  const throttleManager = new ThrottleManager(redis)
  const watcherProcessor = new WatcherProcessor(prisma, throttleManager, logger)

  // Create queue
  const watcherQueue = new Queue('watcher-jobs', {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 30000, // 30 seconds
      },
      removeOnComplete: {
        count: 1000,
        age: 24 * 3600, // Keep for 24 hours
      },
      removeOnFail: {
        count: 5000,
        age: 7 * 24 * 3600, // Keep failed for 7 days
      },
    },
  })

  // Create worker
  const worker = new Worker(
    'watcher-jobs',
    async (job: Job) => {
      logger.info({ jobId: job.id, watcherId: job.data.watcherId }, 'Processing job')

      try {
        const result = await watcherProcessor.process(job.data.watcherId)
        logger.info({ jobId: job.id, result }, 'Job completed')
        return result
      } catch (error) {
        logger.error({ jobId: job.id, error }, 'Job failed')
        throw error
      }
    },
    {
      connection: redis,
      concurrency: CONCURRENCY,
      limiter: {
        max: 10,
        duration: 1000, // 10 jobs per second globally
      },
    }
  )

  // Worker event handlers
  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Job completed successfully')
  })

  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error: error.message }, 'Job failed')
  })

  worker.on('error', (error) => {
    logger.error({ error: error.message }, 'Worker error')
  })

  // Start scheduler
  const scheduler = new Scheduler(prisma, watcherQueue, logger, POLL_INTERVAL)
  scheduler.start()

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...')

    scheduler.stop()

    await worker.close()
    await watcherQueue.close()
    await redis.quit()
    await prisma.$disconnect()

    logger.info('Shutdown complete')
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)

  logger.info(
    { concurrency: CONCURRENCY, pollInterval: POLL_INTERVAL },
    'Worker started successfully'
  )
}

main().catch((error) => {
  console.error('Failed to start worker:', error)
  process.exit(1)
})
