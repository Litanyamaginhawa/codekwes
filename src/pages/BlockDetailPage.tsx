import { Link, useParams } from 'react-router-dom'
import {
  countByCert,
  getCertMeta,
  getItem,
  itemsByCert,
  prettySlug,
  TYPE_DESCRIPTION,
  TYPE_LABEL,
} from '../lib/catalog'
import { withAlpha } from '../lib/color'
import { useProgress } from '../contexts/ProgressContext'
import TypeBadge from '../components/TypeBadge'
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconExternal,
  IconGithub,
} from '../components/icons'

export default function BlockDetailPage() {
  const { certSlug = '', blockSlug = '' } = useParams()
  const item = getItem(certSlug, blockSlug)
  const cert = getCertMeta(certSlug)
  const { isDone, toggle, countForCert } = useProgress()

  if (!item || !cert) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-3xl font-bold text-slate-100">Block not found</h1>
        <p className="mt-3 text-sm text-slate-400">
          This practice block does not exist in the catalog. It may have been renamed upstream by
          freeCodeCamp.
        </p>
        <Link to="/practice" className="btn btn-primary mt-8">
          Back to the catalog
        </Link>
      </div>
    )
  }

  const done = isDone(item.id)
  const certItems = itemsByCert(certSlug)
  const index = certItems.findIndex((entry) => entry.id === item.id)
  const prev = index > 0 ? certItems[index - 1] : null
  const next = index >= 0 && index < certItems.length - 1 ? certItems[index + 1] : null
  const related = certItems
    .filter((entry) => entry.moduleSlug === item.moduleSlug && entry.id !== item.id)
    .slice(0, 6)
  const certTotal = countByCert(certSlug)
  const certDone = countForCert(certSlug)
  const certPct = certTotal > 0 ? Math.round((certDone / certTotal) * 100) : 0

  const sourceUrl = `https://github.com/freeCodeCamp/freeCodeCamp/blob/main/curriculum/structure/superblocks/${certSlug}.json`

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500" aria-label="Breadcrumb">
        <Link to="/practice" className="transition-colors hover:text-brand-300">
          Practice
        </Link>
        <span aria-hidden>/</span>
        <Link
          to={`/practice?cert=${cert.slug}`}
          className="inline-flex items-center gap-1.5 transition-colors hover:text-brand-300"
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cert.accent }} />
          {cert.name}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-slate-400">{prettySlug(item.moduleSlug)}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* --------------------------------------------------- Main column */}
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <TypeBadge type={item.type} />
            {item.isCertProject && (
              <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-xs font-semibold text-amber-200">
                Counts toward certification
              </span>
            )}
            {item.comingSoon && (
              <span className="rounded-full border border-white/15 px-2.5 py-1 text-xs font-semibold text-slate-400">
                Coming soon
              </span>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
            {item.title}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            {TYPE_DESCRIPTION[item.type]}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              {item.type === 'project' ? 'Build it on freeCodeCamp' : 'Solve on freeCodeCamp'}
              <IconExternal size={16} />
            </a>
            <button
              type="button"
              onClick={() => void toggle(item.id)}
              className="btn btn-secondary"
            >
              <IconCheck size={16} className={done ? 'text-mint-400' : ''} />
              {done ? 'Completed — mark as not done' : 'Mark as completed'}
            </button>
          </div>

          {/* Skills */}
          <div className="card mt-10 p-6">
            <h2 className="text-sm font-semibold text-slate-200">
              Skills you will practice in this certification
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {cert.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300"
                >
                  {skill}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              {TYPE_LABEL[item.type]} blocks are part of the{' '}
              <span className="text-slate-400">{cert.name}</span> certification. freeCodeCamp hosts
              and grades every exercise — this site keeps your practice plan and progress in one
              place.{' '}
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="link">
                View the official curriculum source
              </a>
              .
            </p>
          </div>

          {/* Related blocks in the same module */}
          {related.length > 0 && (
            <div className="mt-10">
              <h2 className="text-sm font-semibold text-slate-200">
                More from “{prettySlug(item.moduleSlug)}”
              </h2>
              <ul className="mt-4 divide-y divide-white/5">
                {related.map((entry) => (
                  <li key={entry.id}>
                    <Link
                      to={`/practice/${entry.certSlug}/${entry.blockSlug}`}
                      className="group flex items-center justify-between gap-4 py-3"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <TypeBadge type={entry.type} size="sm" />
                        <span className="truncate text-sm text-slate-300 transition-colors group-hover:text-brand-300">
                          {entry.title}
                        </span>
                      </span>
                      <IconChevronRight size={16} className="shrink-0 text-slate-600" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prev / Next */}
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {prev ? (
              <Link
                to={`/practice/${prev.certSlug}/${prev.blockSlug}`}
                className="card card-hover flex items-center gap-3 p-4"
              >
                <IconChevronLeft size={18} className="shrink-0 text-slate-500" />
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-wide text-slate-500">
                    Previous
                  </span>
                  <span className="block truncate text-sm text-slate-300">{prev.title}</span>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link
                to={`/practice/${next.certSlug}/${next.blockSlug}`}
                className="card card-hover flex items-center justify-end gap-3 p-4 text-right sm:col-start-2"
              >
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-wide text-slate-500">
                    Next
                  </span>
                  <span className="block truncate text-sm text-slate-300">{next.title}</span>
                </span>
                <IconChevronRight size={18} className="shrink-0 text-slate-500" />
              </Link>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------ Sidebar */}
        <aside className="space-y-4">
          <div className="card p-6">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cert.accent }} />
              <h2 className="text-sm font-semibold text-slate-100">{cert.name}</h2>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">{cert.tagline}</p>

            <dl className="mt-5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Difficulty</dt>
                <dd className="font-semibold text-slate-300">{cert.difficulty}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Estimated time</dt>
                <dd className="font-semibold text-slate-300">
                  {cert.estimatedHours ? `≈${cert.estimatedHours} hrs` : '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Blocks</dt>
                <dd className="font-semibold text-slate-300">{certTotal}</dd>
              </div>
            </dl>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Your progress</span>
                <span className="font-semibold text-slate-300">
                  {certDone}/{certTotal} · {certPct}%
                </span>
              </div>
              <div className="bar mt-2">
                <div
                  className="bar-fill"
                  style={{
                    width: `${certPct}%`,
                    background: `linear-gradient(90deg, ${cert.accent}, ${withAlpha(cert.accent, 0.6)})`,
                  }}
                />
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <Link to={`/practice?cert=${cert.slug}`} className="btn btn-secondary w-full">
                Browse all {cert.shortName} blocks
              </Link>
              <a
                href={`https://www.freecodecamp.org/learn/${cert.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost w-full"
              >
                Open certification on freeCodeCamp
                <IconExternal size={14} />
              </a>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <IconGithub size={15} />
              Built on open source
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              The block structure and links on this page are generated from freeCodeCamp’s
              open-source curriculum files. Their codebase is free to read, run and contribute to.
            </p>
            <a
              href="https://github.com/freeCodeCamp/freeCodeCamp"
              target="_blank"
              rel="noopener noreferrer"
              className="link mt-3 inline-block text-xs font-semibold"
            >
              Explore the repository →
            </a>
          </div>
        </aside>
      </div>
    </div>
  )
}
