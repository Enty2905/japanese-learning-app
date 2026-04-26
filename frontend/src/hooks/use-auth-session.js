import { useEffect, useMemo, useState } from 'react'
import {
  getAuthSession,
  subscribeAuthSession,
} from '../services/auth-session.service'

export function useAuthSession() {
  const [session, setSession] = useState(getAuthSession)

  useEffect(() => {
    const unsubscribe = subscribeAuthSession(() => {
      setSession(getAuthSession())
    })

    return unsubscribe
  }, [])

  const user = session?.user || null
  const isAuthenticated = Boolean(session?.token && user)

  return useMemo(
    () => ({
      session,
      user,
      isAuthenticated,
    }),
    [session, user, isAuthenticated],
  )
}
