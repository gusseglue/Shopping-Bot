const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiOptions extends RequestInit {
  token?: string
}

interface ApiResponse<T> {
  data?: T
  error?: string
  status: number
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  setToken(token: string | null) {
    this.token = token
  }

  private async request<T>(
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> {
    const { token, ...fetchOptions } = options

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    const authToken = token || this.token
    if (authToken) {
      ;(headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...fetchOptions,
        headers,
      })

      const data = response.ok ? await response.json() : null
      const errorText = !response.ok ? await response.text() : undefined
      
      let error: string | undefined
      if (errorText) {
        try {
          const errorJson = JSON.parse(errorText)
          error = errorJson.message || errorJson.error || errorText
        } catch {
          error = errorText
        }
      }

      return {
        data,
        error,
        status: response.status,
      }
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Network error',
        status: 0,
      }
    }
  }

  // Auth endpoints
  async register(email: string, password: string, name: string) {
    return this.request<{
      accessToken: string
      refreshToken: string
      expiresIn: number
      user: {
        id: string
        email: string
        name: string
        role: string
        plan: string
      }
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  }

  async login(email: string, password: string) {
    return this.request<{
      accessToken: string
      refreshToken: string
      expiresIn: number
      user: {
        id: string
        email: string
        name: string
        role: string
        plan: string
      }
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async refreshToken(refreshToken: string) {
    return this.request<{
      accessToken: string
      refreshToken: string
      expiresIn: number
      user: {
        id: string
        email: string
        name: string
        role: string
        plan: string
      }
    }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  }

  async verify() {
    return this.request<{
      valid: boolean
      user: {
        id: string
        email: string
        role: string
        plan: string
      }
      subscription: {
        plan: string
        status: string
        expiresAt: string | null
      }
    }>('/auth/verify')
  }

  async logout(refreshToken?: string) {
    return this.request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  }

  // Device endpoints
  async registerDevice(fingerprint: string, name: string, platform: string) {
    return this.request<{
      id: string
      name: string
      platform: string
    }>('/auth/devices', {
      method: 'POST',
      body: JSON.stringify({ fingerprint, name, platform }),
    })
  }

  async getDevices() {
    return this.request<
      Array<{
        id: string
        name: string
        platform: string
        lastSeenAt: string
      }>
    >('/auth/devices')
  }

  async revokeDevice(deviceId: string) {
    return this.request<{ success: boolean }>(`/auth/devices/${deviceId}`, {
      method: 'DELETE',
    })
  }

  // User endpoints
  async getProfile() {
    return this.request<{
      id: string
      email: string
      name: string
      role: string
      createdAt: string
    }>('/users/me')
  }

  async updateProfile(data: { name?: string; email?: string }) {
    return this.request<{
      id: string
      email: string
      name: string
    }>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // Watchers endpoints
  async getWatchers(page = 1, limit = 20, status?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (status) params.append('status', status)
    return this.request<{
      items: Array<{
        id: string
        url: string
        name: string
        domain: string
        rules: object
        interval: number
        status: string
        lastCheckAt: string | null
        errorCount: number
        createdAt: string
      }>
      total: number
      page: number
      pageSize: number
      totalPages: number
    }>(`/watchers?${params}`)
  }

  async getWatcher(id: string) {
    return this.request<{
      id: string
      url: string
      name: string
      domain: string
      rules: object
      interval: number
      status: string
      lastCheckAt: string | null
      lastResult: object | null
      errorCount: number
      alerts: Array<{
        id: string
        type: string
        data: object
        createdAt: string
      }>
    }>(`/watchers/${id}`)
  }

  async createWatcher(data: {
    url: string
    name: string
    rules: object
    interval: number
  }) {
    return this.request<{
      id: string
      url: string
      name: string
      domain: string
    }>('/watchers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateWatcher(
    id: string,
    data: { name?: string; rules?: object; interval?: number; status?: string }
  ) {
    return this.request<{
      id: string
      url: string
      name: string
      status: string
    }>(`/watchers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteWatcher(id: string) {
    return this.request<{ success: boolean }>(`/watchers/${id}`, {
      method: 'DELETE',
    })
  }

  async pauseWatcher(id: string) {
    return this.request<{ status: string }>(`/watchers/${id}/pause`, {
      method: 'POST',
    })
  }

  async resumeWatcher(id: string) {
    return this.request<{ status: string }>(`/watchers/${id}/resume`, {
      method: 'POST',
    })
  }

  // Alerts endpoints
  async getAlerts(page = 1, limit = 20) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    return this.request<{
      items: Array<{
        id: string
        watcherId: string
        type: string
        data: {
          productName?: string
          productUrl?: string
          previousValue?: number | string
          currentValue?: number | string
          message?: string
        }
        readAt: string | null
        createdAt: string
        watcher: {
          name: string
          url: string
        }
      }>
      total: number
      page: number
      pageSize: number
      totalPages: number
    }>(`/alerts?${params}`)
  }

  async markAlertRead(id: string) {
    return this.request<{ success: boolean }>(`/alerts/${id}/read`, {
      method: 'POST',
    })
  }

  async markAllAlertsRead() {
    return this.request<{ success: boolean }>('/alerts/read-all', {
      method: 'POST',
    })
  }

  // Webhook endpoints
  async getWebhooks() {
    return this.request<
      Array<{
        id: string
        type: string
        enabled: boolean
        createdAt: string
      }>
    >('/webhooks')
  }

  async createWebhook(type: string, url: string) {
    return this.request<{
      id: string
      type: string
      enabled: boolean
    }>('/webhooks', {
      method: 'POST',
      body: JSON.stringify({ type, url }),
    })
  }

  async updateWebhook(id: string, data: { url?: string; enabled?: boolean }) {
    return this.request<{
      id: string
      type: string
      enabled: boolean
    }>(`/webhooks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteWebhook(id: string) {
    return this.request<{ success: boolean }>(`/webhooks/${id}`, {
      method: 'DELETE',
    })
  }

  async testWebhook(id: string) {
    return this.request<{ success: boolean; message?: string }>(
      `/webhooks/${id}/test`,
      {
        method: 'POST',
      }
    )
  }

  // Billing endpoints
  async getSubscription() {
    return this.request<{
      plan: string
      status: string
      currentPeriodEnd: string | null
      cancelAtPeriodEnd: boolean
    }>('/billing/subscription')
  }

  async createCheckoutSession(plan: 'basic' | 'pro') {
    return this.request<{ sessionId: string; url: string }>(
      '/billing/checkout',
      {
        method: 'POST',
        body: JSON.stringify({ plan }),
      }
    )
  }

  async createPortalSession() {
    return this.request<{ url: string }>('/billing/portal', {
      method: 'POST',
    })
  }

  // Admin endpoints
  async getAdminStats() {
    return this.request<{
      totalUsers: number
      totalWatchers: number
      activeWatchers: number
      alertsToday: number
      planDistribution: {
        free: number
        basic: number
        pro: number
      }
    }>('/admin/stats')
  }

  async getAdminUsers(page = 1, limit = 20, search?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.append('search', search)
    return this.request<{
      items: Array<{
        id: string
        email: string
        name: string
        role: string
        plan: string
        watcherCount: number
        createdAt: string
      }>
      total: number
      page: number
      pageSize: number
      totalPages: number
    }>(`/admin/users?${params}`)
  }
}

export const api = new ApiClient(API_BASE_URL)
export default api
