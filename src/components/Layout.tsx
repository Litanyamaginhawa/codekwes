import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  IconClose,
  IconCode,
  IconExternal,
  IconGithub,
  IconLogOut,
  IconMenu,
} from './icons'

const NAV_LINKS = [
  { to: '/practice', label: 'Practice' },
  { to: '/playground', label: 'Playground' },
  { to: '/resources', label: 'Resources' },
  { to: '/dashboard', label: 'Dashboard' },
]

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-mint-400 text-ink-950">
        <IconCode size={20} />
      </span>
      <span className="text-base font-bold tracking-tight text-slate-100">
        Code<span className="text-brand-400">Practice</span>
      </span>
    </Link>
  )
}

export default function Layout() {
  const { user, signOut, configured, loading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  // Close the mobile menu on navigation.
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors ' +
    (isActive ? 'bg-white/5 text-white' : 'text-slate-400 hover:text-white')

  return (
    <div className="relative flex min-h-screen flex-col">
      <ScrollToTop />

      {/* Decorative background glows */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-mint-400/10 blur-3xl" />
        <div className="absolute -bottom-32 left-0 h-80 w-80 rounded-full bg-brand-500/5 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Brand />

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {loading ? null : user ? (
              <>
                <span className="max-w-[180px] truncate text-xs text-slate-400" title={user.email ?? ''}>
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="btn btn-secondary btn-sm"
                >
                  <IconLogOut size={14} />
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm">
                Log in
              </Link>
            )}
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <IconClose size={20} /> : <IconMenu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-white/10 bg-ink-950/95 px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink key={link.to} to={link.to} className={navLinkClass}>
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-3 border-t border-white/10 pt-3">
              {user ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-xs text-slate-400">{user.email}</span>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="btn btn-secondary btn-sm"
                  >
                    <IconLogOut size={14} />
                    Sign out
                  </button>
                </div>
              ) : (
                <Link to="/login" className="btn btn-primary btn-sm w-full">
                  Log in
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {!configured && (
        <div className="border-b border-amber-400/20 bg-amber-400/10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2 text-xs text-amber-200 sm:px-6 lg:px-8">
            <span className="font-semibold">Local mode:</span>
            <span className="text-amber-200/80">
              progress is saved in this browser only. Connect Supabase for accounts and cloud sync.
            </span>
            <Link to="/login" className="font-semibold underline underline-offset-2 hover:text-amber-100">
              How to set it up
            </Link>
          </div>
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-24 border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <Brand />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
                Practice coding with freeCodeCamp&apos;s free, open-source curriculum. Browse the
                practice catalog, solve on freeCodeCamp.org, and track your progress.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-200">This site</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {NAV_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-slate-400 transition-colors hover:text-brand-300">
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to="/login" className="text-slate-400 transition-colors hover:text-brand-300">
                    Log in
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-200">freeCodeCamp</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <a
                    href="https://www.freecodecamp.org/learn"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-slate-400 transition-colors hover:text-brand-300"
                  >
                    Learn <IconExternal size={13} />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/freeCodeCamp/freeCodeCamp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-slate-400 transition-colors hover:text-brand-300"
                  >
                    <IconGithub size={14} /> Open-source repo
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.freecodecamp.org/news"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-slate-400 transition-colors hover:text-brand-300"
                  >
                    News <IconExternal size={13} />
                  </a>
                </li>
                <li>
                  <a
                    href="https://forum.freecodecamp.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-slate-400 transition-colors hover:text-brand-300"
                  >
                    Community forum <IconExternal size={13} />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-xs leading-relaxed text-slate-500">
            <p>
              Curriculum structure and practice links are sourced from{' '}
              <a
                href="https://github.com/freeCodeCamp/freeCodeCamp"
                target="_blank"
                rel="noopener noreferrer"
                className="link"
              >
                freeCodeCamp
              </a>{' '}
              (platform code under BSD-3-Clause, curriculum content under CC BY-SA 4.0). All lessons,
              workshops, labs and exams are hosted and run on freeCodeCamp.org. This is an independent
              companion site and is not affiliated with or endorsed by freeCodeCamp.
            </p>
            <p className="mt-2">© {new Date().getFullYear()} CodeKwes. Happy coding!</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
