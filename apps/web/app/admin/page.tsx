'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Eye, BarChart, Loader2 } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  plan: string
  watchersCount: number
  createdAt: string
}

interface Stats {
  totalUsers: number
  planBreakdown: Record<string, number>
  recentSignups: number
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const storedUser = localStorage.getItem('user')
    if (!storedUser) {
      router.push('/(auth)/login')
      return
    }

    const user = JSON.parse(storedUser)
    if (user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    setIsAdmin(true)
    fetchData()
  }

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/users?limit=50', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/users/stats', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data.items || [])
      }

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAdmin || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage users and view platform statistics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Free Users</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.planBreakdown?.FREE || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Basic Users</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.planBreakdown?.BASIC || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pro Users</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.planBreakdown?.PRO || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Signups */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            {stats?.recentSignups || 0} new users in the last 7 days
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>All registered users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left text-sm font-medium">Email</th>
                  <th className="p-4 text-left text-sm font-medium">Name</th>
                  <th className="p-4 text-left text-sm font-medium">Plan</th>
                  <th className="p-4 text-left text-sm font-medium">
                    Watchers
                  </th>
                  <th className="p-4 text-left text-sm font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="p-4 text-sm">{user.email}</td>
                    <td className="p-4 text-sm">{user.name || '-'}</td>
                    <td className="p-4 text-sm">
                      <span className="rounded-full bg-muted px-2 py-1 text-xs">
                        {user.plan}
                      </span>
                    </td>
                    <td className="p-4 text-sm">{user.watchersCount}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
