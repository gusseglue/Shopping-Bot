'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Pause, Play, Loader2, ExternalLink } from 'lucide-react'

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@/lib/api'

interface Watcher {
  id: string
  url: string
  name: string
  domain: string
  status: string
  interval: number
  lastCheckAt: string | null
  createdAt: string
}

const createWatcherSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  name: z.string().min(1, 'Name is required').max(200),
  interval: z.number().min(60).max(86400),
  priceThreshold: z.number().optional(),
  stockStatus: z.boolean().optional(),
})

type CreateWatcherForm = z.infer<typeof createWatcherSchema>

export default function WatchersPage() {
  const { toast } = useToast()
  const [watchers, setWatchers] = useState<Watcher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateWatcherForm>({
    resolver: zodResolver(createWatcherSchema),
    defaultValues: {
      interval: 300,
      stockStatus: true,
    },
  })

  useEffect(() => {
    fetchWatchers()
  }, [])

  const fetchWatchers = async () => {
    try {
      const response = await api.getWatchers()

      if (response.data) {
        setWatchers(response.data.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch watchers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onCreateWatcher = async (data: CreateWatcherForm) => {
    setIsSubmitting(true)

    try {
      const response = await api.createWatcher({
        url: data.url,
        name: data.name,
        interval: data.interval,
        rules: {
          stockStatus: data.stockStatus,
          ...(data.priceThreshold && {
            priceThreshold: { type: 'below', value: data.priceThreshold },
          }),
        },
      })

      if (response.error) {
        throw new Error(response.error)
      }

      toast({
        title: 'Watcher created!',
        description: 'Your product is now being monitored.',
      })

      setIsDialogOpen(false)
      reset()
      fetchWatchers()
    } catch (error) {
      toast({
        title: 'Failed to create watcher',
        description:
          error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleWatcher = async (id: string, action: 'pause' | 'resume') => {
    try {
      const response = action === 'pause' 
        ? await api.pauseWatcher(id)
        : await api.resumeWatcher(id)

      if (response.data) {
        toast({
          title: action === 'pause' ? 'Watcher paused' : 'Watcher resumed',
        })
        fetchWatchers()
      }
    } catch (error) {
      toast({
        title: 'Failed to update watcher',
        variant: 'destructive',
      })
    }
  }

  const deleteWatcher = async (id: string) => {
    if (!confirm('Are you sure you want to delete this watcher?')) return

    try {
      const response = await api.deleteWatcher(id)

      if (response.data?.success) {
        toast({
          title: 'Watcher deleted',
        })
        fetchWatchers()
      }
    } catch (error) {
      toast({
        title: 'Failed to delete watcher',
        variant: 'destructive',
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      case 'ERROR':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
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
          <h1 className="text-3xl font-bold">Watchers</h1>
          <p className="text-muted-foreground">
            Manage your product monitoring watchers
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Watcher
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Watcher</DialogTitle>
              <DialogDescription>
                Add a product URL to start monitoring for price drops and stock
                changes.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onCreateWatcher)}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Product URL</Label>
                  <Input
                    id="url"
                    placeholder="https://example.com/product/123"
                    {...register('url')}
                  />
                  {errors.url && (
                    <p className="text-sm text-destructive">
                      {errors.url.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    placeholder="Nike Air Max 90"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interval">Check Interval (seconds)</Label>
                  <Input
                    id="interval"
                    type="number"
                    min={60}
                    max={86400}
                    {...register('interval', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 60 seconds (1 minute)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceThreshold">
                    Alert when price below (optional)
                  </Label>
                  <Input
                    id="priceThreshold"
                    type="number"
                    placeholder="99.99"
                    {...register('priceThreshold', { valueAsNumber: true })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Watcher
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {watchers.length === 0 ? (
        <Card>
          <CardContent className="flex h-64 flex-col items-center justify-center">
            <p className="mb-4 text-muted-foreground">
              No watchers yet. Create your first watcher to start monitoring
              products!
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Watcher
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {watchers.map((watcher) => (
            <Card key={watcher.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1 text-lg">
                      {watcher.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-1">
                      {watcher.domain}
                    </CardDescription>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                      watcher.status
                    )}`}
                  >
                    {watcher.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interval</span>
                    <span>{watcher.interval}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Check</span>
                    <span>
                      {watcher.lastCheckAt
                        ? new Date(watcher.lastCheckAt).toLocaleString()
                        : 'Never'}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      toggleWatcher(
                        watcher.id,
                        watcher.status === 'ACTIVE' ? 'pause' : 'resume'
                      )
                    }
                  >
                    {watcher.status === 'ACTIVE' ? (
                      <>
                        <Pause className="mr-1 h-3 w-3" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="mr-1 h-3 w-3" />
                        Resume
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(watcher.url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteWatcher(watcher.id)}
                  >
                    <Trash2 className="h-3 w-3" />
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
