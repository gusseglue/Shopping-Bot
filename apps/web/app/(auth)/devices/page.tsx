'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import {
  Monitor,
  Smartphone,
  Tablet,
  Trash2,
  ArrowLeft,
  Loader2,
} from 'lucide-react'

interface Device {
  id: string
  name: string
  platform: string
  lastSeenAt: string
}

export default function DevicesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    const fetchDevices = async () => {
      if (!isAuthenticated) return
      
      try {
        const response = await api.getDevices()
        if (response.data) {
          setDevices(response.data)
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load devices',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDevices()
  }, [isAuthenticated, toast])

  const handleRevoke = async (deviceId: string) => {
    setRevokingId(deviceId)
    try {
      const response = await api.revokeDevice(deviceId)
      if (response.data?.success) {
        setDevices(devices.filter((d) => d.id !== deviceId))
        toast({
          title: 'Device Revoked',
          description: 'The device has been logged out',
        })
      } else {
        throw new Error(response.error || 'Failed to revoke device')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to revoke device',
        variant: 'destructive',
      })
    } finally {
      setRevokingId(null)
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'desktop':
      case 'windows':
      case 'macos':
      case 'linux':
        return <Monitor className="h-6 w-6" />
      case 'mobile':
      case 'ios':
      case 'android':
        return <Smartphone className="h-6 w-6" />
      case 'tablet':
      case 'ipad':
        return <Tablet className="h-6 w-6" />
      default:
        return <Monitor className="h-6 w-6" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Device Management</CardTitle>
          <CardDescription>
            View and manage devices that have access to your account.
            Revoking a device will log it out immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No devices registered yet.
            </p>
          ) : (
            <div className="space-y-4">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-muted-foreground">
                      {getPlatformIcon(device.platform)}
                    </div>
                    <div>
                      <p className="font-medium">{device.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {device.platform} • Last seen: {formatDate(device.lastSeenAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(device.id)}
                    disabled={revokingId === device.id}
                  >
                    {revokingId === device.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
