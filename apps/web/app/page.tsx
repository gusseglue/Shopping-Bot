import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Bell, Shield, Zap, Globe, Clock, MessageSquare } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6" />
            <span className="text-xl font-bold">Shopping Assistant</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm hover:underline">
              Pricing
            </Link>
            <Link href="/faq" className="text-sm hover:underline">
              FAQ
            </Link>
            <Link href="/(auth)/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/(auth)/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Never Miss a Deal Again
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Track product availability, prices, and sizes across your favorite
          online stores. Get instant alerts when products drop in price or come
          back in stock.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/(auth)/signup">
            <Button size="lg">Start Free Trial</Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline">
              View Pricing
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/50 py-24">
        <div className="container">
          <h2 className="text-center text-3xl font-bold">
            Everything You Need to Shop Smarter
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Bell className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Instant Alerts</CardTitle>
                <CardDescription>
                  Get notified immediately via web, email, or Discord when
                  products match your criteria.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Price Tracking</CardTitle>
                <CardDescription>
                  Set price thresholds and get alerted when products drop below
                  your target price.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Stock Monitoring</CardTitle>
                <CardDescription>
                  Know instantly when out-of-stock items become available again.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Globe className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Multiple Stores</CardTitle>
                <CardDescription>
                  Monitor products across dozens of popular online retailers
                  from one dashboard.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Discord Integration</CardTitle>
                <CardDescription>
                  Set up Discord webhooks to receive alerts directly in your
                  server or DMs.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Secure & Private</CardTitle>
                <CardDescription>
                  Your data is encrypted and we never share your information
                  with third parties.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="container py-24">
        <h2 className="text-center text-3xl font-bold">Simple, Fair Pricing</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          Choose the plan that works for you. Start with our free tier or unlock
          all features with Pro.
        </p>
        <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic</CardTitle>
              <CardDescription>Perfect for casual shoppers</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$9.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✓ 10 product watchers</li>
                <li>✓ 5 minute check intervals</li>
                <li>✓ Desktop app monitoring</li>
                <li>✓ Discord webhook alerts</li>
                <li>✓ Email notifications</li>
              </ul>
              <Link href="/(auth)/signup" className="mt-6 block">
                <Button className="w-full">Get Started</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardHeader>
              <div className="mb-2 w-fit rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">
                Popular
              </div>
              <CardTitle>Pro</CardTitle>
              <CardDescription>For power users and resellers</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$29.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✓ 100 product watchers</li>
                <li>✓ 1 minute check intervals</li>
                <li>✓ Cloud-based monitoring</li>
                <li>✓ No app required</li>
                <li>✓ Priority support</li>
                <li>✓ Advanced analytics</li>
              </ul>
              <Link href="/(auth)/signup" className="mt-6 block">
                <Button className="w-full">Start Free Trial</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/50 py-24">
        <div className="container text-center">
          <h2 className="text-3xl font-bold">Ready to Start Saving?</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join thousands of smart shoppers who never miss a deal. Sign up now
            and start tracking your first product in minutes.
          </p>
          <Link href="/(auth)/signup" className="mt-8 inline-block">
            <Button size="lg">Create Free Account</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <span className="font-semibold">Shopping Assistant</span>
            </div>
            <nav className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/pricing" className="hover:underline">
                Pricing
              </Link>
              <Link href="/faq" className="hover:underline">
                FAQ
              </Link>
              <Link href="/terms" className="hover:underline">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              © 2024 Shopping Assistant. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
