import { PrismaClient, Role, Plan, SubscriptionStatus } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: Role.ADMIN,
      subscription: {
        create: {
          stripeCustomerId: 'cus_admin_demo',
          plan: Plan.PRO,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  })
  console.log('Created admin user:', admin.email)

  // Create test user with basic plan
  const testPassword = await bcrypt.hash('test123', 12)
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      passwordHash: testPassword,
      name: 'Test User',
      role: Role.USER,
      subscription: {
        create: {
          stripeCustomerId: 'cus_test_demo',
          plan: Plan.BASIC,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  })
  console.log('Created test user:', testUser.email)

  // Create demo watchers for test user
  const watchers = await Promise.all([
    prisma.watcher.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        userId: testUser.id,
        url: 'https://example.com/product/demo-sneakers',
        name: 'Demo Sneakers',
        domain: 'example.com',
        interval: 300, // 5 minutes
        rules: {
          priceThreshold: { type: 'below', value: 100 },
          stockStatus: true,
        },
      },
    }),
    prisma.watcher.upsert({
      where: { id: '00000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000002',
        userId: testUser.id,
        url: 'https://example.com/product/demo-jacket',
        name: 'Demo Winter Jacket',
        domain: 'example.com',
        interval: 600, // 10 minutes
        rules: {
          sizeAvailability: ['M', 'L'],
        },
      },
    }),
  ])
  console.log('Created demo watchers:', watchers.length)

  // Create sample alerts
  const alerts = await Promise.all([
    prisma.alert.create({
      data: {
        watcherId: watchers[0].id,
        userId: testUser.id,
        type: 'PRICE_CHANGE',
        data: {
          productName: 'Demo Sneakers',
          productUrl: 'https://example.com/product/demo-sneakers',
          previousValue: 120,
          currentValue: 89.99,
          message: 'Price dropped by $30.01!',
        },
      },
    }),
    prisma.alert.create({
      data: {
        watcherId: watchers[1].id,
        userId: testUser.id,
        type: 'BACK_IN_STOCK',
        data: {
          productName: 'Demo Winter Jacket',
          productUrl: 'https://example.com/product/demo-jacket',
          message: 'Product is back in stock!',
        },
      },
    }),
  ])
  console.log('Created demo alerts:', alerts.length)

  console.log('Database seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
