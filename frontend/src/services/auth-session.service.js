const AUTH_STORAGE_KEY = 'japaneseAuth'
const AUTH_SESSION_CHANGED_EVENT = 'auth-session:changed'

function parseSession(rawValue) {
  if (!rawValue) {
    return null
  }

  try {
    const parsedValue = JSON.parse(rawValue)
    if (!parsedValue || typeof parsedValue !== 'object') {
      return null
    }

    if (!parsedValue.token || !parsedValue.user) {
      return null
    }

    return parsedValue
  } catch {
    return null
  }
}

function notifySessionChanged() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT))
}

export function getAuthSession() {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY)
  return parseSession(rawValue)
}

export function saveAuthSession(sessionData) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData))
  notifySessionChanged()
}

export function clearAuthSession() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY)
  notifySessionChanged()
}

export function subscribeAuthSession(listener) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handleStorageChange = (event) => {
    if (event?.key && event.key !== AUTH_STORAGE_KEY) {
      return
    }

    listener()
  }

  window.addEventListener('storage', handleStorageChange)
  window.addEventListener(AUTH_SESSION_CHANGED_EVENT, listener)

  return () => {
    window.removeEventListener('storage', handleStorageChange)
    window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, listener)
  }
}
