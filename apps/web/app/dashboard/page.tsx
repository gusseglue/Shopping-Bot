'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, AlertCircle, Plus, TrendingUp, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface Stats {
  watchersCount: number
  alertsCount: number
  activeWatchers: number
  recentAlerts: Array<{
    id: string
    type: string
    productName: string
    createdAt: string
  }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats({
          watchersCount: data.stats?.watchersCount || 0,
          alertsCount: data.stats?.alertsCount || 0,
          activeWatchers: data.stats?.watchersCount || 0,
          recentAlerts: [],
        })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s an overview of your monitoring.
          </p>
        </div>
        <Link href="/dashboard/watchers">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Watcher
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Watchers</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.watchersCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Products being monitored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Watchers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeWatchers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently checking products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.alertsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Notifications received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Check</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Just now</div>
            <p className="text-xs text-muted-foreground">
              All watchers up to date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>
              Get started with product monitoring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Create your first watcher</p>
                <p className="text-sm text-muted-foreground">
                  Start tracking a product by adding its URL
                </p>
              </div>
              <Link href="/dashboard/watchers">
                <Button size="sm">Add Watcher</Button>
              </Link>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium">Set up Discord notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive alerts directly in Discord
                </p>
              </div>
              <Link href="/dashboard/settings">
                <Button size="sm" variant="outline">
                  Configure
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Your latest notifications</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentAlerts && stats.recentAlerts.length > 0 ? (
              <div className="space-y-4">
                {stats.recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{alert.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {alert.type}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-center">
                <div>
                  <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No alerts yet. Create a watcher to start receiving
                    notifications!
                  </p>
                </div>
              </div>
            )}
            <div className="mt-4">
              <Link href="/dashboard/alerts">
                <Button variant="outline" className="w-full">
                  View All Alerts
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
