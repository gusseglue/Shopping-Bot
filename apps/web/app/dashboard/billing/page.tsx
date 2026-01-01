'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Check, ExternalLink, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

interface Subscription {
  plan: string
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

const plans = [
  {
    name: 'Free',
    key: 'FREE',
    price: '$0',
    features: ['3 watchers', '10 min intervals', 'Desktop app only'],
  },
  {
    name: 'Basic',
    key: 'BASIC',
    price: '$9.99',
    features: [
      '10 watchers',
      '5 min intervals',
      'Discord webhooks',
      'Email notifications',
    ],
  },
  {
    name: 'Pro',
    key: 'PRO',
    price: '$29.99',
    features: [
      '100 watchers',
      '1 min intervals',
      'Cloud monitoring',
      'Priority support',
    ],
    popular: true,
  },
]

export default function BillingPage() {
  const { toast } = useToast()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/billing/subscription', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setSubscription(data)
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = async (plan: string) => {
    setIsUpgrading(plan)

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: plan.toLowerCase() }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      toast({
        title: 'Failed to start checkout',
        description: 'Please try again later.',
        variant: 'destructive',
      })
      setIsUpgrading(null)
    }
  }

  const handleManageBilling = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      toast({
        title: 'Failed to open billing portal',
        variant: 'destructive',
      })
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
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>Current Plan</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{subscription?.plan || 'FREE'}</p>
              <p className="text-sm text-muted-foreground">
                Status: {subscription?.status || 'Active'}
              </p>
              {subscription?.currentPeriodEnd && (
                <p className="text-sm text-muted-foreground">
                  {subscription.cancelAtPeriodEnd
                    ? 'Cancels on'
                    : 'Renews on'}
                  : {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
            {subscription?.plan !== 'FREE' && (
              <Button variant="outline" onClick={handleManageBilling}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Billing
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Available Plans</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = subscription?.plan === plan.key
            return (
              <Card
                key={plan.key}
                className={
                  plan.popular
                    ? 'border-primary'
                    : isCurrent
                      ? 'border-green-500'
                      : ''
                }
              >
                <CardHeader>
                  {plan.popular && (
                    <div className="mb-2 w-fit rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">
                      Popular
                    </div>
                  )}
                  {isCurrent && (
                    <div className="mb-2 w-fit rounded-full bg-green-100 px-3 py-1 text-xs text-green-800 dark:bg-green-900 dark:text-green-100">
                      Current Plan
                    </div>
                  )}
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    /month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {isCurrent ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : plan.key === 'FREE' ? (
                    <Button className="w-full" variant="outline" disabled>
                      Free Forever
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(plan.key)}
                      disabled={isUpgrading === plan.key}
                    >
                      {isUpgrading === plan.key && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Upgrade to {plan.name}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
