import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { sendNotification } from '@tauri-apps/api/notification'
import LoginForm from './components/LoginForm'
import Dashboard from './components/Dashboard'

interface User {
  id: string
  email: string
  name: string | null
  plan: string
}

interface VerifyResponse {
  valid: boolean
  user: User
  subscription: {
    plan: string
    status: string
    expiresAt: string | null
  }
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Try to get stored token from keychain
      const token = await invoke<string | null>('get_token')
      
      if (token) {
        // Verify token with server
        const response = await invoke<VerifyResponse>('verify_token', { token })
        
        if (response.valid) {
          setUser(response.user)
          setIsAuthenticated(true)
          
          // Check subscription status
          if (response.subscription.status !== 'ACTIVE') {
            setError('Your subscription is not active. Monitoring is disabled.')
          }
        } else {
          // Token invalid, clear it
          await invoke('clear_token')
        }
      }
    } catch (err) {
      console.error('Auth check failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (token: string, userData: User) => {
    try {
      // Store token securely in keychain
      await invoke('store_token', { token })
      setUser(userData)
      setIsAuthenticated(true)
      setError(null)
      
      // Show welcome notification
      await sendNotification({
        title: 'Shopping Assistant',
        body: 'You are now logged in and monitoring is active.',
      })
    } catch (err) {
      console.error('Failed to store token:', err)
      setError('Failed to save credentials')
    }
  }

  const handleLogout = async () => {
    try {
      await invoke('clear_token')
      await invoke('stop_monitoring')
      setUser(null)
      setIsAuthenticated(false)
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />
  }

  return (
    <Dashboard
      user={user!}
      error={error}
      onLogout={handleLogout}
    />
  )
}

export default App
