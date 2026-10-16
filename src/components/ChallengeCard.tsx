import { Link } from 'react-router-dom'
import { getCertMeta, prettySlug, type CatalogItem } from '../lib/catalog'
import { withAlpha } from '../lib/color'
import { useProgress } from '../contexts/ProgressContext'
import TypeBadge from './TypeBadge'
import { IconCheck, IconExternal } from './icons'

interface ChallengeCardProps {
  item: CatalogItem
  /** Show the certification name in the meta row (useful on mixed lists). */
  showCert?: boolean
}

export default function ChallengeCard({ item, showCert = true }: ChallengeCardProps) {
  const { isDone, toggle } = useProgress()
  const done = isDone(item.id)
  const cert = getCertMeta(item.certSlug)
  const accent = cert?.accent ?? '#38bdf8'

  return (
    <div className="card card-hover relative flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <TypeBadge type={item.type} size="sm" />
        <button
          type="button"
          onClick={() => void toggle(item.id)}
          className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-colors"
          style={{
            borderColor: done ? withAlpha('#34d399', 0.6) : 'rgba(255,255,255,0.15)',
            backgroundColor: done ? withAlpha('#34d399', 0.18) : 'transparent',
            color: done ? '#34d399' : '#64748b',
          }}
          aria-label={done ? `Mark "${item.title}" as not done` : `Mark "${item.title}" as done`}
          title={done ? 'Completed — click to undo' : 'Mark as completed'}
        >
          <IconCheck size={14} />
        </button>
      </div>

      <div>
        {/* Stretched link: makes the whole card clickable */}
        <Link
          to={`/practice/${item.certSlug}/${item.blockSlug}`}
          className="text-sm font-semibold leading-snug text-slate-100 transition-colors after:absolute after:inset-0 hover:text-brand-300"
        >
          {item.title}
        </Link>
        {item.comingSoon && (
          <span className="ml-2 rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Coming soon
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 text-xs">
        <span className="flex min-w-0 items-center gap-2 text-slate-400">
          {showCert && cert && (
            <>
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
              <span className="truncate">{cert.shortName}</span>
              <span className="text-slate-600">·</span>
            </>
          )}
          <span className="truncate">{prettySlug(item.moduleSlug)}</span>
        </span>

        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative z-10 inline-flex shrink-0 items-center gap-1 font-semibold text-brand-300 transition-colors hover:text-brand-100"
          title="Open on freeCodeCamp.org"
        >
          Practice <IconExternal size={13} />
        </a>
      </div>
    </div>
  )
}
