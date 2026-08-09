import { useState, useEffect } from 'react'
import { apiFetch, setToken, clearToken, getToken } from '@/lib/api'

export interface AppUser {
  id: string
  email: string
  displayName: string
}

export function useAuth() {
  const [user, setUser]           = useState<AppUser | null>(null)
  const [loading, setLoading]     = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  // Restore session from stored JWT on mount
  useEffect(() => {
    if (!getToken()) { setLoading(false); return }
    apiFetch('/api/auth/me')
      .then((u: AppUser) => setUser(u))
      .catch(() => { clearToken() })
      .finally(() => setLoading(false))
  }, [])

  async function handleGoogleCredential(credential: string) {
    setAuthError(null)
    try {
      const { token, user: u } = await apiFetch('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      }) as { token: string; user: AppUser }
      setToken(token)
      setUser(u)
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : 'Sign in failed')
    }
  }

  function signOut() {
    clearToken()
    setUser(null)
  }

  return { user, loading, authError, handleGoogleCredential, signOut }
}
