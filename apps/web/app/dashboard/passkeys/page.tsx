'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import {
  Fingerprint,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Shield,
  Laptop,
  Smartphone,
} from 'lucide-react'
import {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  addPasskey,
  getPasskeys,
  deletePasskey,
  renamePasskey,
} from '@/lib/webauthn'

interface Passkey {
  id: string
  name: string | null
  credentialDeviceType: string
  createdAt: string
  lastUsedAt: string | null
}

export default function PasskeysPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  const [passkeys, setPasskeys] = useState<Passkey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingPasskey, setIsAddingPasskey] = useState(false)
  const [webAuthnSupported, setWebAuthnSupported] = useState(false)
  const [platformAvailable, setPlatformAvailable] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPasskey, setSelectedPasskey] = useState<Passkey | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    const checkWebAuthn = async () => {
      setWebAuthnSupported(isWebAuthnSupported())
      setPlatformAvailable(await isPlatformAuthenticatorAvailable())
    }
    checkWebAuthn()
  }, [])

  const fetchPasskeys = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      const token = localStorage.getItem('shopping_assistant_token')
      if (!token) return

      const data = await getPasskeys(token)
      setPasskeys(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load passkeys',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, toast])

  useEffect(() => {
    fetchPasskeys()
  }, [fetchPasskeys])

  const handleAddPasskey = async () => {
    setIsAddingPasskey(true)

    try {
      const token = localStorage.getItem('shopping_assistant_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const passkey = await addPasskey(token, `Passkey ${new Date().toLocaleDateString()}`)

      setPasskeys((prev) => [passkey, ...prev])

      toast({
        title: 'Passkey added',
        description: 'Your new passkey has been registered successfully.',
      })
    } catch (error) {
      toast({
        title: 'Failed to add passkey',
        description:
          error instanceof Error ? error.message : 'Unable to add passkey',
        variant: 'destructive',
      })
    } finally {
      setIsAddingPasskey(false)
    }
  }

  const handleDeletePasskey = async () => {
    if (!selectedPasskey) return

    setIsDeleting(true)

    try {
      const token = localStorage.getItem('shopping_assistant_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      await deletePasskey(token, selectedPasskey.id)

      setPasskeys((prev) => prev.filter((p) => p.id !== selectedPasskey.id))

      toast({
        title: 'Passkey deleted',
        description: 'The passkey has been removed from your account.',
      })
    } catch (error) {
      toast({
        title: 'Failed to delete passkey',
        description:
          error instanceof Error ? error.message : 'Unable to delete passkey',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setSelectedPasskey(null)
    }
  }

  const handleRenamePasskey = async () => {
    if (!selectedPasskey || !newName.trim()) return

    setIsRenaming(true)

    try {
      const token = localStorage.getItem('shopping_assistant_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const updated = await renamePasskey(token, selectedPasskey.id, newName.trim())

      setPasskeys((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      )

      toast({
        title: 'Passkey renamed',
        description: 'The passkey name has been updated.',
      })
    } catch (error) {
      toast({
        title: 'Failed to rename passkey',
        description:
          error instanceof Error ? error.message : 'Unable to rename passkey',
        variant: 'destructive',
      })
    } finally {
      setIsRenaming(false)
      setRenameDialogOpen(false)
      setSelectedPasskey(null)
      setNewName('')
    }
  }

  const openDeleteDialog = (passkey: Passkey) => {
    setSelectedPasskey(passkey)
    setDeleteDialogOpen(true)
  }

  const openRenameDialog = (passkey: Passkey) => {
    setSelectedPasskey(passkey)
    setNewName(passkey.name || '')
    setRenameDialogOpen(true)
  }

  const getDeviceIcon = (deviceType: string) => {
    if (deviceType === 'singleDevice') {
      return <Smartphone className="h-5 w-5" />
    }
    return <Laptop className="h-5 w-5" />
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Passkeys</h1>
          <p className="text-muted-foreground">
            Manage your passkeys for passwordless authentication
          </p>
        </div>
      </div>

      {!webAuthnSupported ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Passkeys Not Supported</h3>
            <p className="text-muted-foreground">
              Your browser does not support passkeys. Please use a modern browser
              like Chrome, Firefox, Safari, or Edge.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                Your Passkeys
              </CardTitle>
              <CardDescription>
                Passkeys provide a secure and convenient way to sign in without
                passwords. They use biometrics (like Face ID or fingerprint) or
                your device&apos;s screen lock.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {passkeys.length === 0 ? (
                  <div className="text-center py-8">
                    <Fingerprint className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      You don&apos;t have any passkeys registered yet.
                    </p>
                    <Button
                      onClick={handleAddPasskey}
                      disabled={isAddingPasskey || !platformAvailable}
                    >
                      {isAddingPasskey ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Add Your First Passkey
                    </Button>
                    {!platformAvailable && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Your device doesn&apos;t have a platform authenticator available.
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {passkeys.map((passkey) => (
                        <div
                          key={passkey.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-muted-foreground">
                              {getDeviceIcon(passkey.credentialDeviceType)}
                            </div>
                            <div>
                              <p className="font-medium">
                                {passkey.name || 'Unnamed Passkey'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Created: {formatDate(passkey.createdAt)}
                                {passkey.lastUsedAt && (
                                  <> • Last used: {formatDate(passkey.lastUsedAt)}</>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openRenameDialog(passkey)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(passkey)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={handleAddPasskey}
                      disabled={isAddingPasskey || !platformAvailable}
                      variant="outline"
                      className="mt-4"
                    >
                      {isAddingPasskey ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Add Another Passkey
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About Passkeys</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">🔐 More Secure</h4>
                  <p className="text-sm text-muted-foreground">
                    Passkeys are resistant to phishing attacks and data breaches
                    because they never leave your device.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">⚡ Faster Login</h4>
                  <p className="text-sm text-muted-foreground">
                    No more typing passwords. Just use your fingerprint, face, or
                    device PIN to sign in instantly.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">📱 Works Everywhere</h4>
                  <p className="text-sm text-muted-foreground">
                    Use passkeys across your devices. Synced passkeys work on all
                    your Apple, Google, or Microsoft devices.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">🎯 Easy Recovery</h4>
                  <p className="text-sm text-muted-foreground">
                    Register multiple passkeys on different devices for backup
                    access if you lose one device.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Passkey</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this passkey? You won&apos;t be able
              to use it to sign in anymore.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm font-medium">
            {selectedPasskey?.name || 'Unnamed Passkey'}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePasskey}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Passkey</DialogTitle>
            <DialogDescription>
              Give your passkey a memorable name to identify it easily.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="My MacBook"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenamePasskey}
              disabled={isRenaming || !newName.trim()}
            >
              {isRenaming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
