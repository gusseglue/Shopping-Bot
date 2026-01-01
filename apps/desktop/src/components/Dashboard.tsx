import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/tauri'

interface User {
  id: string
  email: string
  name: string | null
  plan: string
}

interface Watcher {
  id: string
  name: string
  url: string
  status: string
  lastCheckAt: string | null
}

interface DashboardProps {
  user: User
  error: string | null
  onLogout: () => void
}

export default function Dashboard({ user, error, onLogout }: DashboardProps) {
  const [watchers, setWatchers] = useState<Watcher[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)

  useEffect(() => {
    fetchWatchers()
    checkMonitoringStatus()
  }, [])

  const fetchWatchers = async () => {
    try {
      const result = await invoke<Watcher[]>('get_watchers')
      setWatchers(result)
    } catch (err) {
      console.error('Failed to fetch watchers:', err)
    }
  }

  const checkMonitoringStatus = async () => {
    try {
      const status = await invoke<boolean>('is_monitoring')
      setIsMonitoring(status)
    } catch (err) {
      console.error('Failed to check monitoring status:', err)
    }
  }

  const toggleMonitoring = async () => {
    try {
      if (isMonitoring) {
        await invoke('stop_monitoring')
      } else {
        await invoke('start_monitoring')
      }
      setIsMonitoring(!isMonitoring)
    } catch (err) {
      console.error('Failed to toggle monitoring:', err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500'
      case 'PAUSED':
        return 'bg-yellow-500'
      case 'ERROR':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold">Shopping Assistant</h1>
            <span className="rounded-full bg-gray-700 px-2 py-1 text-xs">
              {user.plan}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{user.email}</span>
            <button
              onClick={onLogout}
              className="text-sm text-gray-400 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-red-900/50 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Main content */}
      <main className="p-4">
        {/* Monitoring status */}
        <div className="mb-6 flex items-center justify-between rounded-lg bg-gray-800 p-4">
          <div>
            <h2 className="font-semibold">Monitoring Status</h2>
            <p className="text-sm text-gray-400">
              {isMonitoring
                ? 'Your products are being monitored'
                : 'Monitoring is paused'}
            </p>
          </div>
          <button
            onClick={toggleMonitoring}
            className={`rounded-md px-4 py-2 font-medium ${
              isMonitoring
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isMonitoring ? 'Stop' : 'Start'}
          </button>
        </div>

        {/* Watchers list */}
        <div className="rounded-lg bg-gray-800">
          <div className="border-b border-gray-700 px-4 py-3">
            <h2 className="font-semibold">Your Watchers</h2>
          </div>
          {watchers.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p>No watchers yet.</p>
              <p className="mt-2 text-sm">
                Create watchers on the web dashboard to start monitoring.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {watchers.map((watcher) => (
                <div
                  key={watcher.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{watcher.name}</p>
                    <p className="truncate text-sm text-gray-400">
                      {watcher.url}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${getStatusColor(
                        watcher.status
                      )}`}
                    />
                    <span className="text-sm text-gray-400">
                      {watcher.lastCheckAt
                        ? `Last check: ${new Date(
                            watcher.lastCheckAt
                          ).toLocaleTimeString()}`
                        : 'Never checked'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
