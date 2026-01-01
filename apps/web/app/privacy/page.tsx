import Link from 'next/link'
import { Bell } from 'lucide-react'

export default function PrivacyPage() {
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
          <h1>Privacy Policy</h1>
          <p className="lead">Last updated: January 1, 2024</p>

          <h2>1. Introduction</h2>
          <p>
            Shopping Assistant (we, us, our) respects your privacy and is
            committed to protecting your personal data. This privacy policy
            explains how we collect, use, and safeguard your information when
            you use our Service.
          </p>

          <h2>2. Information We Collect</h2>
          <h3>Account Information</h3>
          <ul>
            <li>Email address</li>
            <li>Name (optional)</li>
            <li>Password (hashed)</li>
          </ul>

          <h3>Usage Information</h3>
          <ul>
            <li>Product URLs you monitor</li>
            <li>Alert preferences and rules</li>
            <li>Webhook URLs (encrypted)</li>
            <li>Device information for registered devices</li>
          </ul>

          <h3>Technical Information</h3>
          <ul>
            <li>IP addresses (for security and rate limiting)</li>
            <li>Browser type and version</li>
            <li>Login timestamps</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide and maintain the Service</li>
            <li>Send notifications and alerts you have configured</li>
            <li>Process payments and manage subscriptions</li>
            <li>Detect and prevent fraud and abuse</li>
            <li>Improve and personalize the Service</li>
            <li>Communicate with you about your account</li>
          </ul>

          <h2>4. Data Security</h2>
          <p>We implement strong security measures to protect your data:</p>
          <ul>
            <li>
              <strong>Encryption in Transit:</strong> All data is transmitted
              over TLS (HTTPS)
            </li>
            <li>
              <strong>Encryption at Rest:</strong> Sensitive data like webhook
              URLs are encrypted in our database
            </li>
            <li>
              <strong>Password Hashing:</strong> Passwords are hashed using
              bcrypt with strong salting
            </li>
            <li>
              <strong>Access Controls:</strong> Strict access controls limit who
              can access your data
            </li>
            <li>
              <strong>Desktop App:</strong> Secrets are stored in your operating
              system&apos;s secure keychain
            </li>
          </ul>

          <h2>5. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. If you
            delete your account, we will delete your personal data within 30
            days, except where we are required by law to retain it longer.
          </p>

          <h2>6. Data Sharing</h2>
          <p>
            We do not sell your personal data. We may share data with:
          </p>
          <ul>
            <li>
              <strong>Payment Processors:</strong> Stripe for payment processing
            </li>
            <li>
              <strong>Service Providers:</strong> Infrastructure providers who
              help us operate the Service
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law or to
              protect our rights
            </li>
          </ul>

          <h2>7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your account and data</li>
            <li>Export your data</li>
            <li>Object to certain processing</li>
          </ul>
          <p>
            To exercise these rights, contact us at{' '}
            <a href="mailto:privacy@example.com">privacy@example.com</a>
          </p>

          <h2>8. Cookies</h2>
          <p>
            We use essential cookies for authentication and session management.
            We do not use tracking cookies for advertising purposes.
          </p>

          <h2>9. Third-Party Links</h2>
          <p>
            The Service may contain links to monitored product pages. We are not
            responsible for the privacy practices of these external sites.
          </p>

          <h2>10. Children&apos;s Privacy</h2>
          <p>
            The Service is not intended for users under 18 years of age. We do
            not knowingly collect data from children.
          </p>

          <h2>11. International Transfers</h2>
          <p>
            Your data may be transferred to and processed in countries other
            than your own. We ensure appropriate safeguards are in place for
            such transfers.
          </p>

          <h2>12. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify
            you of significant changes via email or through the Service.
          </p>

          <h2>13. Contact Us</h2>
          <p>
            For questions about this Privacy Policy, please contact us at:{' '}
            <a href="mailto:privacy@example.com">privacy@example.com</a>
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
              <Link href="/terms" className="hover:underline">
                Terms of Service
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
