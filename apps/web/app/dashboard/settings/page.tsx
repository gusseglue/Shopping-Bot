'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MessageSquare, Loader2, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

const webhookSchema = z.object({
  url: z.string().url('Please enter a valid Discord webhook URL'),
})

type WebhookForm = z.infer<typeof webhookSchema>

export default function SettingsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [webhookId, setWebhookId] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WebhookForm>({
    resolver: zodResolver(webhookSchema),
  })

  const onSubmit = async (data: WebhookForm) => {
    setIsLoading(true)

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'discord',
          url: data.url,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save webhook')
      }

      setWebhookId(result.id)
      setIsConnected(true)

      toast({
        title: 'Discord webhook saved!',
        description: 'You will now receive alerts in Discord.',
      })
    } catch (error) {
      toast({
        title: 'Failed to save webhook',
        description:
          error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testWebhook = async () => {
    if (!webhookId) return

    setIsTesting(true)

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/webhooks/${webhookId}/test`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast({
          title: 'Test message sent!',
          description: 'Check your Discord channel.',
        })
      } else {
        throw new Error('Failed to send test')
      }
    } catch (error) {
      toast({
        title: 'Test failed',
        description: 'Could not send test message to Discord.',
        variant: 'destructive',
      })
    } finally {
      setIsTesting(false)
    }
  }

  const disconnectWebhook = async () => {
    if (!webhookId) return

    try {
      const token = localStorage.getItem('accessToken')
      await fetch(`/api/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setWebhookId(null)
      setIsConnected(false)

      toast({
        title: 'Discord disconnected',
      })
    } catch (error) {
      toast({
        title: 'Failed to disconnect',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure your notification preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <CardTitle>Discord Notifications</CardTitle>
            </div>
            <CardDescription>
              Receive alerts directly in your Discord server
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-green-800 dark:text-green-200">
                    Discord is connected
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={testWebhook}
                    disabled={isTesting}
                  >
                    {isTesting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Send Test
                  </Button>
                  <Button variant="destructive" onClick={disconnectWebhook}>
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook">Discord Webhook URL</Label>
                  <Input
                    id="webhook"
                    placeholder="https://discord.com/api/webhooks/..."
                    {...register('url')}
                  />
                  {errors.url && (
                    <p className="text-sm text-destructive">
                      {errors.url.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Create a webhook in your Discord server settings under
                    Integrations
                  </p>
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Connect Discord
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Choose which alerts you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Price Drops</p>
                  <p className="text-sm text-muted-foreground">
                    Alert when price falls below threshold
                  </p>
                </div>
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Back in Stock</p>
                  <p className="text-sm text-muted-foreground">
                    Alert when product is restocked
                  </p>
                </div>
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Size Available</p>
                  <p className="text-sm text-muted-foreground">
                    Alert when specific size becomes available
                  </p>
                </div>
                <Check className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
