import { z } from 'zod'

// User Schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: z.enum(['user', 'admin']),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1).max(100).optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Device Schemas
export const deviceSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  fingerprint: z.string(),
  platform: z.enum(['windows', 'macos', 'linux', 'web']),
  lastSeenAt: z.date(),
  createdAt: z.date(),
})

export const registerDeviceSchema = z.object({
  name: z.string().min(1).max(100),
  fingerprint: z.string().min(16).max(256),
  platform: z.enum(['windows', 'macos', 'linux', 'web']),
})

// Watcher Schemas
export const priceRuleSchema = z.object({
  type: z.enum(['below', 'above', 'change']),
  value: z.number().positive().optional(),
  percentage: z.number().min(0).max(100).optional(),
})

export const watcherRulesSchema = z.object({
  priceThreshold: priceRuleSchema.optional(),
  stockStatus: z.boolean().optional(),
  sizeAvailability: z.array(z.string()).optional(),
  customSelector: z.string().max(500).optional(),
})

export const createWatcherSchema = z.object({
  url: z.string().url('Invalid URL'),
  name: z.string().min(1).max(200),
  rules: watcherRulesSchema,
  interval: z.number().min(60).max(86400), // 1 min to 24 hours
})

export const updateWatcherSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  rules: watcherRulesSchema.optional(),
  interval: z.number().min(60).max(86400).optional(),
  status: z.enum(['active', 'paused']).optional(),
})

export const watcherSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  url: z.string().url(),
  name: z.string(),
  domain: z.string(),
  rules: watcherRulesSchema,
  interval: z.number(),
  status: z.enum(['active', 'paused', 'error', 'disabled']),
  lastCheckAt: z.date().nullable(),
  lastAlertAt: z.date().nullable(),
  errorCount: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Alert Schemas
export const alertDataSchema = z.object({
  productName: z.string(),
  productUrl: z.string().url(),
  previousValue: z.union([z.string(), z.number()]).optional(),
  currentValue: z.union([z.string(), z.number()]).optional(),
  message: z.string().optional(),
})

export const alertSchema = z.object({
  id: z.string().uuid(),
  watcherId: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(['price_change', 'back_in_stock', 'size_available', 'error']),
  data: alertDataSchema,
  readAt: z.date().nullable(),
  createdAt: z.date(),
})

// Webhook Schemas
export const createWebhookSchema = z.object({
  type: z.enum(['discord', 'slack', 'custom']),
  url: z.string().url('Invalid webhook URL'),
})

export const webhookConfigSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(['discord', 'slack', 'custom']),
  url: z.string(),
  enabled: z.boolean(),
  lastTestedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Pagination Schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

// API Response Schema
export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
})

// Type exports from schemas
export type CreateUserInput = z.infer<typeof createUserSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>
export type CreateWatcherInput = z.infer<typeof createWatcherSchema>
export type UpdateWatcherInput = z.infer<typeof updateWatcherSchema>
export type CreateWebhookInput = z.infer<typeof createWebhookSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
