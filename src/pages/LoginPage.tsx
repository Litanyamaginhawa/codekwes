import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { IconLoader } from '../components/icons'

const SETUP_STEPS = [
  {
    title: 'Create a free Supabase project',
    body: 'Go to supabase.com/dashboard, create a project, and wait for it to finish provisioning.',
  },
  {
    title: 'Run the database schema',
    body: 'Open the SQL Editor in your new project and run the file supabase/schema.sql from this repo. It creates the profiles, progress and snippets tables with RLS policies.',
  },
  {
    title: 'Copy your API credentials',
    body: 'In Supabase, go to Project Settings → API and copy the Project URL and the anon public key.',
  },
  {
    title: 'Add the environment variables',
    body: 'Locally: copy .env.example to .env and paste the values. On Cloudflare Pages: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY under Settings → Environment variables, then redeploy.',
  },
]

export default function LoginPage() {
  const { user, configured, loading, signIn, signUp, signOut } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [user, loading, navigate])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setInfo(null)

    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Your password must be at least 6 characters long.')
      return
    }

    setSubmitting(true)
    if (mode === 'signin') {
      const message = await signIn(email.trim(), password)
      setSubmitting(false)
      if (message) setError(message)
    } else {
      const result = await signUp(email.trim(), password)
      setSubmitting(false)
      if (result.error) {
        setError(result.error)
      } else if (result.needsConfirmation) {
        setInfo(
          'Account created! Check your inbox for a confirmation email, then come back and log in.',
        )
      }
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">
          {configured ? 'Your practice account' : 'Cloud accounts are one setup away'}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-400">
          {configured
            ? 'Log in to sync your freeCodeCamp progress and code snippets across every device.'
            : 'This site is running in local mode — progress works and stays in this browser. To enable accounts and cloud sync, connect your own Supabase project (free tier).'}
        </p>
      </div>

      {!configured ? (
        <div className="card mt-8 p-6 sm:p-8">
          <h2 className="text-sm font-semibold text-slate-200">Set up Supabase in 4 steps</h2>
          <ol className="mt-4 space-y-4">
            {SETUP_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-mint-400 text-xs font-bold text-ink-950">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{step.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <pre className="mt-5 overflow-x-auto rounded-xl border border-white/10 bg-ink-950/80 p-4 font-mono text-xs leading-relaxed text-slate-300">
            <code>
              {'VITE_SUPABASE_URL=https://your-project-ref.supabase.co\n'}
              {'VITE_SUPABASE_ANON_KEY=your-anon-public-key'}
            </code>
          </pre>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Tip: in Supabase, under Authentication → Providers → Email you can turn off “Confirm
            email” during development so you can sign up and log in instantly.
          </p>
        </div>
      ) : (
        <div className="card mx-auto mt-8 max-w-md p-6 sm:p-8">
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
            <button
              type="button"
              onClick={() => {
                setMode('signin')
                setError(null)
                setInfo(null)
              }}
              className={
                'rounded-lg px-3 py-2 text-sm font-semibold transition-colors ' +
                (mode === 'signin' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200')
              }
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setError(null)
                setInfo(null)
              }}
              className={
                'rounded-lg px-3 py-2 text-sm font-semibold transition-colors ' +
                (mode === 'signup' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200')
              }
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="input"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-slate-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                className="input"
                required
              />
            </div>

            {error && (
              <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-300">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-lg border border-mint-400/30 bg-mint-400/10 px-3 py-2 text-xs text-mint-300">
                {info}
              </p>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
              {submitting && <IconLoader size={15} />}
              {mode === 'signin' ? 'Log in' : 'Create account'}
            </button>
          </form>

          {user && (
            <button
              type="button"
              onClick={() => void signOut()}
              className="btn btn-ghost btn-sm mt-4 w-full"
            >
              Sign out of {user.email}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
