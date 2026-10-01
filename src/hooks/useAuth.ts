import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface AppUser {
  id: string
  email: string
  displayName: string
}

function toAppUser(user: User): AppUser {
  return {
    id:          user.id,
    email:       user.email ?? '',
    displayName: user.user_metadata.full_name ?? user.user_metadata.name ?? user.email ?? '',
  }
}

export function useAuth() {
  const [user, setUser]           = useState<AppUser | null>(null)
  const [loading, setLoading]     = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) setAuthError(error.message)
        setUser(data.session?.user ? toAppUser(data.session.user) : null)
      })
      .finally(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? toAppUser(session.user) : null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn() {
    setAuthError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setAuthError(error.message)
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) setAuthError(error.message)
    setUser(null)
  }

  return { user, loading, authError, signIn, signOut }
}
