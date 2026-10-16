import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  catalog,
  certMetaList,
  countByCert,
  getCertMeta,
  TYPE_LABEL,
  type CatalogItem,
} from '../lib/catalog'
import { withAlpha } from '../lib/color'
import { useProgress } from '../contexts/ProgressContext'
import { useAuth } from '../contexts/AuthContext'
import { useSnippets } from '../hooks/useSnippets'
import TypeBadge from '../components/TypeBadge'
import {
  IconArrowRight,
  IconBook,
  IconCheck,
  IconTerminal,
  IconZap,
} from '../components/icons'

export default function DashboardPage() {
  const { user, configured } = useAuth()
  const { completed, mode, countForCert, loading } = useProgress()
  const { snippets } = useSnippets()

  const total = catalog.length
  const doneTotal = completed.size
  const overallPct = total > 0 ? Math.round((doneTotal / total) * 100) : 0

  const continueItem: CatalogItem | null = useMemo(() => {
    const ranked = certMetaList
      .map((cert) => ({
        cert,
        done: countForCert(cert.slug),
        totalBlocks: countByCert(cert.slug),
      }))
      .filter((entry) => entry.totalBlocks > 0)
      .sort((a, b) => b.done / b.totalBlocks - a.done / a.totalBlocks)

    for (const entry of ranked) {
      const nextItem = catalog.find(
        (item) => item.certSlug === entry.cert.slug && !completed.has(item.id),
      )
      if (nextItem) return nextItem
    }
    return null
  }, [completed, countForCert])

  const completedItems = useMemo(
    () => catalog.filter((item) => completed.has(item.id)),
    [completed],
  )
  const recentCompleted = completedItems.slice(0, 12)

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Your dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">
            {user ? (
              <>
                Signed in as <span className="font-semibold text-slate-200">{user.email}</span>
              </>
            ) : (
              'Progress overview for this browser'
            )}
          </p>
        </div>
        <span
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
          style={
            mode === 'cloud'
              ? {
                  color: '#34d399',
                  borderColor: withAlpha('#34d399', 0.35),
                  backgroundColor: withAlpha('#34d399', 0.1),
                }
              : {
                  color: '#fbbf24',
                  borderColor: withAlpha('#fbbf24', 0.35),
                  backgroundColor: withAlpha('#fbbf24', 0.1),
                }
          }
        >
          <IconZap size={13} />
          {mode === 'cloud' ? 'Synced to your account' : 'Saved in this browser'}
        </span>
      </div>

      {/* Notices */}
      {!configured && (
        <div className="card mt-6 border-amber-400/20 bg-amber-400/5 p-4 text-xs leading-relaxed text-amber-200/90">
          <span className="font-semibold text-amber-200">Local mode:</span> this site is not
          connected to Supabase yet, so progress lives in this browser only. Follow the setup guide
          on the{' '}
          <Link to="/login" className="font-semibold underline underline-offset-2">
            login page
          </Link>{' '}
          to enable accounts and cloud sync.
        </div>
      )}
      {configured && !user && (
        <div className="card mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-semibold text-slate-200">
              Log in to sync your progress everywhere
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Right now {doneTotal > 0 ? `${doneTotal} completed block${doneTotal === 1 ? '' : 's'} are` : 'your progress is'} stored
              in this browser. Sign in and anything you have already checked off will be merged into
              your account.
            </p>
          </div>
          <Link to="/login" className="btn btn-primary btn-sm shrink-0">
            Log in or create an account
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Blocks completed
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-100">
            {loading ? '…' : doneTotal}
            <span className="text-base font-semibold text-slate-500"> / {total}</span>
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Overall progress
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{overallPct}%</p>
          <div className="bar mt-3">
            <div
              className="bar-fill bg-gradient-to-r from-brand-400 to-mint-400"
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Saved snippets
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{snippets.length}</p>
          <Link
            to="/playground"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-300 hover:text-brand-100"
          >
            <IconTerminal size={13} />
            Open playground
          </Link>
        </div>
      </div>

      {/* Continue learning */}
      {continueItem &&
        (() => {
          const cert = getCertMeta(continueItem.certSlug)
          return (
            <div className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Continue learning
              </h2>
              <div className="card card-hover mt-3 flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <TypeBadge type={continueItem.type} size="sm" />
                    {cert && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: cert.accent }}
                        />
                        {cert.shortName}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-base font-semibold text-slate-100">{continueItem.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {TYPE_LABEL[continueItem.type]} ·{' '}
                    {continueItem.moduleSlug.replace(/-/g, ' ')}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link
                    to={`/practice/${continueItem.certSlug}/${continueItem.blockSlug}`}
                    className="btn btn-primary btn-sm"
                  >
                    Continue
                    <IconArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          )
        })()}

      {/* Per-certification progress */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Progress by certification
        </h2>
        <div className="card mt-3 divide-y divide-white/5">
          {certMetaList.map((cert) => {
            const certTotal = countByCert(cert.slug)
            const certDone = countForCert(cert.slug)
            const pct = certTotal > 0 ? Math.round((certDone / certTotal) * 100) : 0
            return (
              <div
                key={cert.slug}
                className="flex flex-wrap items-center gap-4 px-5 py-4 sm:flex-nowrap"
              >
                <div className="flex min-w-[180px] flex-1 items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: cert.accent }}
                  />
                  <span className="truncate text-sm font-medium text-slate-200">{cert.name}</span>
                </div>
                <div className="flex flex-1 items-center gap-3">
                  <div className="bar flex-1">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${cert.accent}, ${withAlpha(cert.accent, 0.55)})`,
                      }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right text-xs text-slate-400">
                    {certDone}/{certTotal}
                  </span>
                </div>
                <Link
                  to={`/practice?cert=${cert.slug}`}
                  className="shrink-0 text-xs font-semibold text-brand-300 transition-colors hover:text-brand-100"
                >
                  Browse →
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* Completed blocks */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Completed blocks
        </h2>
        {recentCompleted.length === 0 ? (
          <div className="card mt-3 p-8 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-400/20 to-mint-400/20 text-brand-300">
              <IconBook size={22} />
            </span>
            <p className="mt-4 text-sm font-semibold text-slate-200">Nothing checked off yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              Pick a workshop or lab from the catalog, solve it on freeCodeCamp.org, then hit the
              checkmark on the card to start filling this dashboard.
            </p>
            <Link to="/practice" className="btn btn-primary mt-5">
              Browse the catalog
            </Link>
          </div>
        ) : (
          <>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {recentCompleted.map((item) => (
                <li key={item.id}>
                  <Link
                    to={`/practice/${item.certSlug}/${item.blockSlug}`}
                    className="card card-hover flex items-center gap-3 p-4"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-mint-400/40 bg-mint-400/15 text-mint-400">
                      <IconCheck size={13} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-slate-200">{item.title}</span>
                      <span className="block truncate text-[11px] text-slate-500">
                        {getCertMeta(item.certSlug)?.shortName ?? item.certSlug}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {completedItems.length > recentCompleted.length && (
              <p className="mt-4 text-center text-xs text-slate-500">
                …and {completedItems.length - recentCompleted.length} more completed block
                {completedItems.length - recentCompleted.length === 1 ? '' : 's'}.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
