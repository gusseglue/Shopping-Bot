'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Bell, Loader2, Fingerprint } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { isWebAuthnSupported, registerWithPasskey } from '@/lib/webauthn'

const signupSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type SignupForm = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false)
  const [webAuthnSupported, setWebAuthnSupported] = useState(false)
  const [showPasskeyForm, setShowPasskeyForm] = useState(false)

  useEffect(() => {
    setWebAuthnSupported(isWebAuthnSupported())
  }, [])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  })

  const nameValue = watch('name')
  const emailValue = watch('email')

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed')
      }

      // Store tokens
      localStorage.setItem('accessToken', result.accessToken)
      localStorage.setItem('refreshToken', result.refreshToken)
      localStorage.setItem('user', JSON.stringify(result.user))

      toast({
        title: 'Account created!',
        description: 'Welcome to Shopping Assistant.',
      })

      router.push('/dashboard')
    } catch (error) {
      toast({
        title: 'Registration failed',
        description:
          error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasskeySignup = async () => {
    if (!emailValue || !emailValue.includes('@')) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address to register with a passkey.',
        variant: 'destructive',
      })
      return
    }

    setIsPasskeyLoading(true)

    try {
      const result = await registerWithPasskey(emailValue, nameValue, 'Default Passkey')

      // Store tokens
      localStorage.setItem('accessToken', result.accessToken)
      localStorage.setItem('refreshToken', result.refreshToken)
      localStorage.setItem('user', JSON.stringify(result.user))

      toast({
        title: 'Account created!',
        description: 'Welcome to Shopping Assistant. Your passkey has been registered.',
      })

      router.push('/dashboard')
    } catch (error) {
      toast({
        title: 'Passkey registration failed',
        description:
          error instanceof Error ? error.message : 'Unable to register with passkey',
        variant: 'destructive',
      })
    } finally {
      setIsPasskeyLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mb-4 flex items-center justify-center gap-2">
            <Bell className="h-6 w-6" />
            <span className="text-xl font-bold">Shopping Assistant</span>
          </Link>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Start tracking your favorite products today
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            {!showPasskeyForm && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">
                      {errors.password.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            {!showPasskeyForm ? (
              <>
                <Button type="submit" className="w-full" disabled={isLoading || isPasskeyLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
                {webAuthnSupported && (
                  <>
                    <div className="relative w-full">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or register with
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowPasskeyForm(true)}
                      disabled={isLoading || isPasskeyLoading}
                    >
                      <Fingerprint className="mr-2 h-4 w-4" />
                      Register with Passkey
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                <Button
                  type="button"
                  className="w-full"
                  onClick={handlePasskeySignup}
                  disabled={isLoading || isPasskeyLoading}
                >
                  {isPasskeyLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Fingerprint className="mr-2 h-4 w-4" />
                  )}
                  Create Account with Passkey
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowPasskeyForm(false)}
                  disabled={isLoading || isPasskeyLoading}
                >
                  Use password instead
                </Button>
              </>
            )}
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                href="/(auth)/login"
                className="text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
            <p className="text-center text-xs text-muted-foreground">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
