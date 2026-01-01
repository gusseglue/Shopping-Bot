'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import { api } from './api'

interface User {
  id: string
  email: string
  name: string
  role: string
  plan: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'shopping_assistant_token'
const REFRESH_TOKEN_KEY = 'shopping_assistant_refresh_token'
const USER_KEY = 'shopping_assistant_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const saveAuth = useCallback(
    (
      accessToken: string,
      refreshToken: string,
      userData: User
    ) => {
      localStorage.setItem(TOKEN_KEY, accessToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      api.setToken(accessToken)
      setUser(userData)
    },
    []
  )

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    api.setToken(null)
    setUser(null)
  }, [])

  const refreshAuth = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    if (!refreshToken) {
      clearAuth()
      return
    }

    try {
      const response = await api.refreshToken(refreshToken)
      if (response.data) {
        saveAuth(
          response.data.accessToken,
          response.data.refreshToken,
          response.data.user
        )
      } else {
        clearAuth()
      }
    } catch {
      clearAuth()
    }
  }, [clearAuth, saveAuth])

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY)
      const storedUser = localStorage.getItem(USER_KEY)

      if (token && storedUser) {
        api.setToken(token)
        try {
          const userData = JSON.parse(storedUser)
          setUser(userData)
          // Verify token is still valid
          const response = await api.verify()
          if (response.data?.valid) {
            setUser({
              ...userData,
              plan: response.data.subscription.plan,
            })
          } else {
            // Token expired, try to refresh
            await refreshAuth()
          }
        } catch {
          await refreshAuth()
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [refreshAuth])

  // Set up token refresh interval
  useEffect(() => {
    if (!user) return

    // Refresh token every 10 minutes
    const interval = setInterval(
      () => {
        refreshAuth()
      },
      10 * 60 * 1000
    )

    return () => clearInterval(interval)
  }, [user, refreshAuth])

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password)
    if (response.error) {
      throw new Error(response.error)
    }
    if (response.data) {
      saveAuth(
        response.data.accessToken,
        response.data.refreshToken,
        response.data.user
      )
    }
  }

  const register = async (email: string, password: string, name: string) => {
    const response = await api.register(email, password, name)
    if (response.error) {
      throw new Error(response.error)
    }
    if (response.data) {
      saveAuth(
        response.data.accessToken,
        response.data.refreshToken,
        response.data.user
      )
    }
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
    try {
      await api.logout(refreshToken || undefined)
    } finally {
      clearAuth()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// HOC for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth()

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        window.location.href = '/login'
      }
    }, [isLoading, isAuthenticated])

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return null
    }

    return <Component {...props} />
  }
}
