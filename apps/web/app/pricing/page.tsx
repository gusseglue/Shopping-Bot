import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Bell, Check } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    description: 'Try it out',
    price: '$0',
    interval: '/month',
    features: [
      '3 product watchers',
      '10 minute check intervals',
      'Desktop app only',
      'Basic notifications',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Basic',
    description: 'For casual shoppers',
    price: '$9.99',
    interval: '/month',
    features: [
      '10 product watchers',
      '5 minute check intervals',
      'Desktop app monitoring',
      'Discord webhook alerts',
      'Email notifications',
      'Price history (30 days)',
    ],
    cta: 'Start Basic',
    popular: false,
  },
  {
    name: 'Pro',
    description: 'For power users',
    price: '$29.99',
    interval: '/month',
    features: [
      '100 product watchers',
      '1 minute check intervals',
      'Cloud-based monitoring (no app needed)',
      'Discord & Slack webhooks',
      'Email + SMS notifications',
      'Price history (unlimited)',
      'Advanced analytics',
      'Priority support',
      'Custom domain adapters',
    ],
    cta: 'Start Pro Trial',
    popular: true,
  },
]

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Bell className="h-6 w-6" />
            <span className="text-xl font-bold">Shopping Assistant</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/faq" className="text-sm hover:underline">
              FAQ
            </Link>
            <Link href="/(auth)/login">
              <Button variant="outline">Login</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">
              Simple, Transparent Pricing
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Choose the plan that fits your shopping habits. All plans include
              a 14-day free trial. No credit card required.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-6xl gap-8 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.popular ? 'border-primary shadow-lg' : ''}
              >
                <CardHeader>
                  {plan.popular && (
                    <div className="mb-2 w-fit rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">
                      Most Popular
                    </div>
                  )}
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">
                      {plan.interval}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-5 w-5 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/(auth)/signup" className="w-full">
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* FAQ Link */}
          <div className="mt-16 text-center">
            <p className="text-muted-foreground">
              Have questions?{' '}
              <Link href="/faq" className="text-primary hover:underline">
                Check out our FAQ
              </Link>{' '}
              or{' '}
              <a
                href="mailto:support@example.com"
                className="text-primary hover:underline"
              >
                contact us
              </a>
            </p>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="border-t bg-muted/50 py-24">
          <div className="container">
            <h2 className="text-center text-3xl font-bold">
              Compare All Features
            </h2>
            <div className="mx-auto mt-12 max-w-4xl overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 text-left">Feature</th>
                    <th className="p-4 text-center">Free</th>
                    <th className="p-4 text-center">Basic</th>
                    <th className="p-4 text-center">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-4">Product Watchers</td>
                    <td className="p-4 text-center">3</td>
                    <td className="p-4 text-center">10</td>
                    <td className="p-4 text-center">100</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Check Interval</td>
                    <td className="p-4 text-center">10 min</td>
                    <td className="p-4 text-center">5 min</td>
                    <td className="p-4 text-center">1 min</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Desktop App</td>
                    <td className="p-4 text-center">✓</td>
                    <td className="p-4 text-center">✓</td>
                    <td className="p-4 text-center">✓</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Cloud Monitoring</td>
                    <td className="p-4 text-center">-</td>
                    <td className="p-4 text-center">-</td>
                    <td className="p-4 text-center">✓</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Discord Webhooks</td>
                    <td className="p-4 text-center">-</td>
                    <td className="p-4 text-center">✓</td>
                    <td className="p-4 text-center">✓</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Email Notifications</td>
                    <td className="p-4 text-center">-</td>
                    <td className="p-4 text-center">✓</td>
                    <td className="p-4 text-center">✓</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Price History</td>
                    <td className="p-4 text-center">-</td>
                    <td className="p-4 text-center">30 days</td>
                    <td className="p-4 text-center">Unlimited</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-4">Priority Support</td>
                    <td className="p-4 text-center">-</td>
                    <td className="p-4 text-center">-</td>
                    <td className="p-4 text-center">✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <span className="font-semibold">Shopping Assistant</span>
            </div>
            <nav className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:underline">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
