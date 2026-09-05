import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { saveAuthSession } from '../../services/auth-session.service'
import { login, register } from '../../services/auth.service'
import './auth-page.css'

function createInitialFormState() {
  return {
    name: '',
    email: '',
    password: '',
  }
}

export function AuthPage({ mode = 'login' }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedPath = searchParams.get('redirect') || '/'
  const returnTo = requestedPath.startsWith('/') && !requestedPath.startsWith('//') && !/[\\\\\r\n]/.test(requestedPath) && !requestedPath.startsWith('/auth') ? requestedPath : '/'
  const redirectQuery = returnTo === '/' ? '' : `?redirect=${encodeURIComponent(returnTo)}`
  const isLoginMode = mode !== 'register'
  const [formState, setFormState] = useState(createInitialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  let submitLabel = isLoginMode ? 'Đăng nhập' : 'Tạo tài khoản'
  if (isSubmitting) {
    submitLabel = 'Đang xử lý...'
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target

    setFormState((previousState) => ({
      ...previousState,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const authPayload = {
        email: formState.email,
        password: formState.password,
      }

      const response = isLoginMode
        ? await login(authPayload)
        : await register({
            ...authPayload,
            name: formState.name,
          })

      saveAuthSession(response)
      setSuccessMessage(response.message || 'Xác thực thành công.')

      navigate(returnTo, { replace: true })
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page" id="main-content" tabIndex={-1}>
      <aside className="auth-story" aria-label="Sổ học tiếng Nhật">
        <Link to="/" className="auth-brand">JP <span>Japanese Learning</span></Link>
        <span className="ui-eyebrow">SỔ HỌC TIẾNG NHẬT</span>
        <h2>Mỗi ngày một chữ.<br />Mỗi ngày tiến xa hơn.</h2>
        <p>Một nơi để lưu bài học, gom những từ mới và nhìn lại hành trình của bạn.</p>
        <div className="auth-practice" lang="ja" aria-hidden="true">学</div>
        <small>Từ những nét chữ đầu tiên đến mục tiêu JLPT.</small>
      </aside>
      <section className="auth-card" aria-label="Xác thực">
        <Link to="/" className="auth-back-link">
          Về trang chủ
        </Link>

        <h1>{isLoginMode ? 'Đăng nhập' : 'Tạo tài khoản'}</h1>
        <p>
          {isLoginMode
            ? 'Đăng nhập để tiếp tục hành trình học tiếng Nhật.'
            : 'Đăng ký để lưu tiến độ và tạo flashcard.'}
        </p>

        <nav className="auth-toggle-group" aria-label="Chế độ xác thực">
          <Link
            to={`/auth${redirectQuery}`}
            className={`auth-toggle ${isLoginMode ? 'active' : ''}`}
            aria-current={isLoginMode ? 'page' : undefined}
          >
            Đăng nhập
          </Link>
          <Link
            to={`/auth/register${redirectQuery}`}
            className={`auth-toggle ${isLoginMode ? '' : 'active'}`}
            aria-current={!isLoginMode ? 'page' : undefined}
          >
            Đăng ký
          </Link>
        </nav>
        {returnTo !== '/' ? <p role="status" className="ui-status">Đăng nhập để mở nội dung bạn vừa chọn.</p> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLoginMode ? (
            <label className="auth-field" htmlFor="name">
              Họ và tên
              <input
                id="name"
                name="name"
                type="text"
                value={formState.name}
                onChange={handleInputChange}
                autoComplete="name"
                required
              />
            </label>
          ) : null}

          <label className="auth-field" htmlFor="email">
            Email
            <input
              id="email"
              name="email"
              type="email"
              value={formState.email}
              onChange={handleInputChange}
              autoComplete="email"
              required
            />
          </label>

          <label className="auth-field" htmlFor="password">
            Mật khẩu
            <input
              id="password"
              name="password"
              type="password"
              value={formState.password}
              onChange={handleInputChange}
              autoComplete={isLoginMode ? 'current-password' : 'new-password'}
              required
            />
          </label>

          <button type="submit" className="auth-submit" disabled={isSubmitting}>
            {submitLabel}
          </button>

          {errorMessage ? (
            <p role="alert" className="auth-form-message auth-form-message--error">{errorMessage}</p>
          ) : null}

          {successMessage ? (
            <p role="status" className="auth-form-message auth-form-message--success">{successMessage}</p>
          ) : null}
        </form>
      </section>
    </main>
  )
}
