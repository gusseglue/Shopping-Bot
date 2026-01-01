'use client'

import { useEffect, useState } from 'react'
import {
  AlertCircle,
  DollarSign,
  Package,
  CheckCircle,
  Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

interface Alert {
  id: string
  type: string
  data: {
    productName: string
    productUrl: string
    previousValue?: string | number
    currentValue?: string | number
    message?: string
  }
  readAt: string | null
  createdAt: string
  watcher: {
    id: string
    name: string
    url: string
  }
}

export default function AlertsPage() {
  const { toast } = useToast()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const [alertsRes, countRes] = await Promise.all([
        fetch('/api/alerts', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/alerts/unread-count', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (alertsRes.ok) {
        const data = await alertsRes.json()
        setAlerts(data.items || [])
      }

      if (countRes.ok) {
        const data = await countRes.json()
        setUnreadCount(data.count || 0)
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/alerts/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        fetchAlerts()
      }
    } catch (error) {
      toast({
        title: 'Failed to mark as read',
        variant: 'destructive',
      })
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/alerts/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        toast({ title: 'All alerts marked as read' })
        fetchAlerts()
      }
    } catch (error) {
      toast({
        title: 'Failed to mark all as read',
        variant: 'destructive',
      })
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'PRICE_CHANGE':
        return <DollarSign className="h-5 w-5 text-green-500" />
      case 'BACK_IN_STOCK':
        return <Package className="h-5 w-5 text-blue-500" />
      case 'SIZE_AVAILABLE':
        return <CheckCircle className="h-5 w-5 text-purple-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
    }
  }

  const formatAlertType = (type: string) => {
    switch (type) {
      case 'PRICE_CHANGE':
        return 'Price Change'
      case 'BACK_IN_STOCK':
        return 'Back in Stock'
      case 'SIZE_AVAILABLE':
        return 'Size Available'
      case 'ERROR':
        return 'Error'
      default:
        return type
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alerts</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            Mark All as Read
          </Button>
        )}
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center">
            <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              No alerts yet. Alerts will appear here when products match your
              criteria.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              className={alert.readAt ? 'opacity-75' : 'border-primary/50'}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <CardTitle className="text-lg">
                        {alert.data.productName}
                      </CardTitle>
                      <CardDescription>
                        {formatAlertType(alert.type)} •{' '}
                        {new Date(alert.createdAt).toLocaleString()}
                      </CardDescription>
                    </div>
                  </div>
                  {!alert.readAt && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsRead(alert.id)}
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{alert.data.message}</p>
                {alert.data.previousValue !== undefined &&
                  alert.data.currentValue !== undefined && (
                    <div className="mt-2 flex gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Was: {alert.data.previousValue}
                      </span>
                      <span className="font-medium text-green-600">
                        Now: {alert.data.currentValue}
                      </span>
                    </div>
                  )}
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(alert.data.productUrl, '_blank')}
                  >
                    View Product
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
