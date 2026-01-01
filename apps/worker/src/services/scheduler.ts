import { Queue } from 'bullmq'
import { PrismaClient, WatcherStatus } from '@prisma/client'
import { Logger } from 'pino'

/**
 * Scheduler that polls for due watchers and adds them to the job queue
 */
export class Scheduler {
  private prisma: PrismaClient
  private queue: Queue
  private logger: Logger
  private pollInterval: number
  private intervalId: NodeJS.Timeout | null = null
  private running = false

  constructor(
    prisma: PrismaClient,
    queue: Queue,
    logger: Logger,
    pollInterval: number = 30000
  ) {
    this.prisma = prisma
    this.queue = queue
    this.logger = logger.child({ service: 'scheduler' })
    this.pollInterval = pollInterval
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.running) {
      this.logger.warn('Scheduler is already running')
      return
    }

    this.running = true
    this.logger.info({ pollInterval: this.pollInterval }, 'Starting scheduler')

    // Run immediately, then on interval
    this.poll()
    this.intervalId = setInterval(() => this.poll(), this.pollInterval)
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.running) return

    this.running = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.logger.info('Scheduler stopped')
  }

  /**
   * Poll for due watchers and queue them
   */
  private async poll(): Promise<void> {
    if (!this.running) return

    try {
      const dueWatchers = await this.getDueWatchers()

      if (dueWatchers.length === 0) {
        this.logger.debug('No due watchers found')
        return
      }

      this.logger.info({ count: dueWatchers.length }, 'Found due watchers')

      for (const watcher of dueWatchers) {
        // Check if job is already in queue
        const existingJob = await this.queue.getJob(`watcher-${watcher.id}`)
        if (existingJob) {
          const state = await existingJob.getState()
          if (state === 'active' || state === 'waiting' || state === 'delayed') {
            this.logger.debug({ watcherId: watcher.id }, 'Job already in queue')
            continue
          }
        }

        // Add job to queue
        await this.queue.add(
          'check-watcher',
          {
            watcherId: watcher.id,
            userId: watcher.userId,
            url: watcher.url,
            domain: watcher.domain,
          },
          {
            jobId: `watcher-${watcher.id}`,
            priority: this.calculatePriority(watcher),
          }
        )

        this.logger.debug({ watcherId: watcher.id, domain: watcher.domain }, 'Queued watcher')
      }
    } catch (error) {
      this.logger.error({ error }, 'Error polling for due watchers')
    }
  }

  /**
   * Get watchers that are due for checking
   */
  private async getDueWatchers() {
    const now = new Date()

    return this.prisma.watcher.findMany({
      where: {
        status: WatcherStatus.ACTIVE,
        OR: [
          // Never checked
          { lastCheckAt: null },
          // Due for check based on interval
          {
            lastCheckAt: {
              lt: new Date(now.getTime() - 60 * 1000), // At least 1 minute ago
            },
          },
        ],
      },
      select: {
        id: true,
        userId: true,
        url: true,
        domain: true,
        interval: true,
        lastCheckAt: true,
        errorCount: true,
      },
      take: 100, // Limit per poll
      orderBy: [
        { lastCheckAt: { sort: 'asc', nulls: 'first' } },
        { createdAt: 'asc' },
      ],
    })
  }

  /**
   * Calculate job priority based on watcher properties
   * Lower number = higher priority
   */
  private calculatePriority(watcher: {
    interval: number
    lastCheckAt: Date | null
    errorCount: number
  }): number {
    let priority = 10

    // Higher priority for shorter intervals
    if (watcher.interval <= 60) priority -= 3
    else if (watcher.interval <= 300) priority -= 1

    // Lower priority for watchers with errors
    priority += watcher.errorCount

    // Higher priority for watchers that haven't been checked in a while
    if (watcher.lastCheckAt) {
      const timeSinceCheck = Date.now() - watcher.lastCheckAt.getTime()
      const intervalMs = watcher.interval * 1000
      if (timeSinceCheck > intervalMs * 2) priority -= 2
    } else {
      // Never checked, high priority
      priority -= 5
    }

    return Math.max(1, Math.min(priority, 20))
  }
}
