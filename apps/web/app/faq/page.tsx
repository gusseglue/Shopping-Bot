'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'

const faqs = [
  {
    question: 'What is Shopping Assistant?',
    answer:
      'Shopping Assistant is a product monitoring and alerting platform that helps you track product availability, prices, and sizes across online stores. When a product matches your criteria (price drops, back in stock, etc.), you receive instant notifications via web, email, or Discord.',
  },
  {
    question: 'Does this automatically buy products for me?',
    answer:
      'No. Shopping Assistant is strictly a monitoring and notification tool. We do NOT automatically purchase products, bypass queue systems, solve captchas, or circumvent any website protections. The software only monitors public product pages and sends you alerts so you can make purchase decisions yourself.',
  },
  {
    question: 'Which stores are supported?',
    answer:
      'We support a wide range of popular online retailers including Amazon, eBay, Walmart, Target, Best Buy, Nike, Adidas, Footlocker, Zalando, and many more. We are constantly adding new stores. If you need a specific store, contact us and we will prioritize it.',
  },
  {
    question: 'What is the difference between Basic and Pro plans?',
    answer:
      'Basic plan runs monitoring on your desktop app (your computer needs to be on). Pro plan runs monitoring on our cloud servers 24/7, so you never miss an alert even when your computer is off. Pro also offers faster check intervals (1 minute vs 5 minutes) and more watchers (100 vs 10).',
  },
  {
    question: 'How often are products checked?',
    answer:
      'Check frequency depends on your plan. Free users get checks every 10 minutes, Basic every 5 minutes, and Pro every 1 minute. We implement polite monitoring with rate limiting to respect website terms of service.',
  },
  {
    question: 'How do Discord webhook notifications work?',
    answer:
      'You can connect a Discord webhook URL to receive alerts directly in your Discord server or DMs. When a product matches your criteria, we send a rich embed message with product details, price, and a direct link to the product page.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. All data is encrypted in transit (TLS) and at rest. Sensitive data like webhook URLs are stored with field-level encryption. We never share your data with third parties. The desktop app stores secrets in your operating system\'s secure keychain.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes, you can cancel your subscription at any time from the billing page. Your subscription will remain active until the end of your current billing period. We do not offer refunds for partial months.',
  },
  {
    question: 'Do you respect website terms of service?',
    answer:
      'Absolutely. We implement polite monitoring with per-domain rate limiting, exponential backoff, and conditional requests. We respect robots.txt directives and website terms. We never attempt to bypass any protections.',
  },
  {
    question: 'What happens if a website blocks the monitoring?',
    answer:
      'If a website temporarily blocks our requests, we implement exponential backoff and retry later. After multiple failures, the watcher is marked as "error" and you are notified. We continuously work to maintain compatibility with supported stores.',
  },
]

export default function FAQPage() {
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
            <Link href="/pricing" className="text-sm hover:underline">
              Pricing
            </Link>
            <Link href="/(auth)/login">
              <Button variant="outline">Login</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight">
              Frequently Asked Questions
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to know about Shopping Assistant
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-3xl">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="mt-16 text-center">
            <p className="text-muted-foreground">
              Still have questions?{' '}
              <a
                href="mailto:support@example.com"
                className="text-primary hover:underline"
              >
                Contact our support team
              </a>
            </p>
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
              <Link href="/pricing" className="hover:underline">
                Pricing
              </Link>
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
