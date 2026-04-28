const LOGIN_REQUIRED_MESSAGE = 'Bạn chưa đăng nhập. Vui lòng đăng nhập để sử dụng chức năng này.'
const LOGIN_REQUIRED_PATHS = ['/lessons', '/flashcards', '/profile', '/assistant', '/phrases']

function getPathname(to) {
  if (typeof to === 'string') {
    return to
  }

  return to?.pathname || ''
}

export function isLoginRequiredPath(to) {
  const pathname = getPathname(to)

  return LOGIN_REQUIRED_PATHS.some((path) => (
    pathname === path || pathname.startsWith(`${path}/`)
  ))
}

export function notifyLoginRequired() {
  if (typeof window === 'undefined') {
    return
  }

  window.alert(LOGIN_REQUIRED_MESSAGE)
}
