import Link from 'next/link'
import { Bell } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Bell className="h-6 w-6" />
            <span className="text-xl font-bold">Shopping Assistant</span>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <article className="container prose prose-slate mx-auto max-w-3xl py-16 dark:prose-invert">
          <h1>Terms of Service</h1>
          <p className="lead">Last updated: January 1, 2024</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Shopping Assistant (the Service), you agree
            to be bound by these Terms of Service. If you do not agree to these
            terms, please do not use the Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Shopping Assistant is a product monitoring and notification service
            that tracks product availability, prices, and variants across online
            stores. The Service provides alerts via web, email, and webhook
            integrations.
          </p>

          <h2>3. Important Limitations</h2>
          <p>The Service is designed for monitoring and notifications only. The Service does NOT:</p>
          <ul>
            <li>Automatically purchase products on your behalf</li>
            <li>Bypass queue systems, captchas, or bot detection mechanisms</li>
            <li>Circumvent rate limits or website protections</li>
            <li>Violate the terms of service of monitored websites</li>
          </ul>
          <p>
            Users must comply with the terms of service of all monitored
            websites. Shopping Assistant implements polite monitoring practices
            including rate limiting and respecting robots.txt directives.
          </p>

          <h2>4. User Accounts</h2>
          <p>
            You must provide accurate and complete information when creating an
            account. You are responsible for maintaining the security of your
            account credentials. You must notify us immediately of any
            unauthorized access to your account.
          </p>

          <h2>5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any illegal purpose</li>
            <li>Attempt to circumvent any security measures</li>
            <li>Share your account credentials with others</li>
            <li>Use the Service to monitor products for automated purchasing</li>
            <li>Resell or redistribute access to the Service</li>
          </ul>

          <h2>6. Subscription and Payment</h2>
          <p>
            Paid subscriptions are billed monthly. You can cancel at any time,
            and your subscription will remain active until the end of the
            current billing period. We do not offer refunds for partial months.
          </p>

          <h2>7. Intellectual Property</h2>
          <p>
            The Service and its original content, features, and functionality
            are owned by Shopping Assistant and are protected by international
            copyright, trademark, and other intellectual property laws.
          </p>

          <h2>8. Disclaimer of Warranties</h2>
          <p>
            The Service is provided as is without warranties of any kind. We
            do not guarantee that the Service will be uninterrupted, secure, or
            error-free. Product information obtained through the Service may not
            always be accurate or up-to-date.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            Shopping Assistant shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages resulting from your use
            of the Service, including but not limited to missed purchase
            opportunities or inaccurate product information.
          </p>

          <h2>10. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will
            notify users of significant changes via email or through the
            Service. Continued use of the Service after changes constitutes
            acceptance of the new terms.
          </p>

          <h2>11. Termination</h2>
          <p>
            We may terminate or suspend your account at any time for violation
            of these terms. Upon termination, your right to use the Service will
            cease immediately.
          </p>

          <h2>12. Contact</h2>
          <p>
            For questions about these Terms of Service, please contact us at:{' '}
            <a href="mailto:legal@example.com">legal@example.com</a>
          </p>
        </article>
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
