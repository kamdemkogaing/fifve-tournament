import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Login() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const destination = location.state?.from?.pathname
    ? `${location.state.from.pathname}${location.state.from.search ?? ''}`
    : '/'

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError

        if (data.session) {
          navigate(destination, { replace: true })
        } else {
          setMessage('Konto erstellt. Bitte bestätige deine E-Mail und melde dich danach an.')
          setMode('login')
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
        navigate(destination, { replace: true })
      }
    } catch (err) {
      setError(err.message ?? 'Anmeldung fehlgeschlagen.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!loading && user) return <Navigate to={destination} replace />

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow">
      <h1 className="text-2xl font-semibold">
        {mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Melde dich an, um Turniere zu erstellen und Ergebnisse zu verwalten.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium">
          E-Mail
          <input
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={event => setEmail(event.target.value)}
          />
        </label>

        <label className="block text-sm font-medium">
          Passwort
          <input
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={8}
            required
            value={password}
            onChange={event => setPassword(event.target.value)}
          />
        </label>

        {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {message && (
          <div className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{message}</div>
        )}

        <button
          className="w-full rounded-xl bg-black px-4 py-2.5 font-medium text-white disabled:opacity-50"
          disabled={submitting}
          type="submit"
        >
          {submitting
            ? 'Bitte warten...'
            : mode === 'login'
              ? 'Anmelden'
              : 'Konto erstellen'}
        </button>
      </form>

      <button
        className="mt-4 w-full text-sm text-gray-600 underline"
        onClick={() => {
          setMode(current => (current === 'login' ? 'register' : 'login'))
          setError('')
          setMessage('')
        }}
        type="button"
      >
        {mode === 'login' ? 'Noch kein Konto? Registrieren' : 'Bereits registriert? Anmelden'}
      </button>
    </div>
  )
}
