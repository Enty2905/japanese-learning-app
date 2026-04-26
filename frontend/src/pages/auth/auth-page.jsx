import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  const isLoginMode = mode !== 'register'
  const [formState, setFormState] = useState(createInitialFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  let submitLabel = isLoginMode ? 'Login' : 'Create account'
  if (isSubmitting) {
    submitLabel = 'Processing...'
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
      setSuccessMessage(response.message || 'Authentication successful.')

      navigate('/', { replace: true })
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-label="Authentication">
        <Link to="/" className="auth-back-link">
          Back to Dashboard
        </Link>

        <h1>{isLoginMode ? 'Login' : 'Create Account'}</h1>
        <p>
          {isLoginMode
            ? 'Sign in to continue your Japanese learning journey.'
            : 'Register to save your progress and build flash cards.'}
        </p>

        <div className="auth-toggle-group" role="tablist" aria-label="Authentication mode">
          <Link
            to="/auth"
            className={`auth-toggle ${isLoginMode ? 'active' : ''}`}
            role="tab"
            aria-selected={isLoginMode}
          >
            Login
          </Link>
          <Link
            to="/auth/register"
            className={`auth-toggle ${isLoginMode ? '' : 'active'}`}
            role="tab"
            aria-selected={!isLoginMode}
          >
            Sign Up
          </Link>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLoginMode ? (
            <label className="auth-field" htmlFor="name">
              Full name
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
            Password
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
            <p className="auth-form-message auth-form-message--error">{errorMessage}</p>
          ) : null}

          {successMessage ? (
            <p className="auth-form-message auth-form-message--success">{successMessage}</p>
          ) : null}
        </form>
      </section>
    </main>
  )
}
