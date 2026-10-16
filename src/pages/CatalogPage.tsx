import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  catalog,
  certMetaList,
  countByCert,
  getCertMeta,
  TYPE_LABEL,
  type BlockType,
} from '../lib/catalog'
import { useProgress } from '../contexts/ProgressContext'
import ChallengeCard from '../components/ChallengeCard'
import { IconCheck, IconSearch } from '../components/icons'

const PAGE_SIZE = 48

const TYPE_FILTERS: { value: 'all' | BlockType; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'lesson', label: TYPE_LABEL.lesson },
  { value: 'workshop', label: TYPE_LABEL.workshop },
  { value: 'lab', label: TYPE_LABEL.lab },
  { value: 'review', label: TYPE_LABEL.review },
  { value: 'quiz', label: TYPE_LABEL.quiz },
  { value: 'exam', label: TYPE_LABEL.exam },
  { value: 'project', label: TYPE_LABEL.project },
]

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { completed } = useProgress()

  const cert = searchParams.get('cert') ?? 'all'
  const type = (searchParams.get('type') ?? 'all') as 'all' | BlockType
  const query = searchParams.get('q') ?? ''
  const [hideDone, setHideDone] = useState(false)
  const [visible, setVisible] = useState(PAGE_SIZE)

  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === '' || value === 'all') next.delete(key)
      else next.set(key, value)
    }
    setSearchParams(next, { replace: true })
  }

  useEffect(() => {
    setVisible(PAGE_SIZE)
  }, [cert, type, query, hideDone])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return catalog.filter((item) => {
      if (cert !== 'all' && item.certSlug !== cert) return false
      if (type !== 'all' && item.type !== type) return false
      if (hideDone && completed.has(item.id)) return false
      if (q) {
        const meta = getCertMeta(item.certSlug)
        const haystack = [
          item.title,
          item.blockSlug,
          item.moduleSlug.replace(/-/g, ' '),
          meta?.name ?? '',
          meta?.shortName ?? '',
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [cert, type, query, hideDone, completed])

  const shown = filtered.slice(0, visible)
  const doneCount = completed.size
  const hasActiveFilters = cert !== 'all' || type !== 'all' || query !== '' || hideDone

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Practice catalog</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            Every lesson, workshop, lab, review, quiz and certification project from freeCodeCamp’s
            current curriculum. Pick one, practice it on freeCodeCamp.org, then mark it as done here.
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p className="font-semibold text-slate-300">
            {doneCount} of {catalog.length} blocks completed
          </p>
          <div className="bar mt-2 w-40">
            <div
              className="bar-fill bg-gradient-to-r from-brand-400 to-mint-400"
              style={{ width: `${catalog.length > 0 ? (doneCount / catalog.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------- Filters */}
      <div className="card mt-8 p-4 sm:p-5">
        <div className="relative">
          <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(event) => updateParams({ q: event.target.value })}
            placeholder="Search blocks — try “binary search”, “flexbox”, “react forms”…"
            className="input pl-9"
            aria-label="Search practice blocks"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Certification
          </span>
          <button
            type="button"
            className={'chip' + (cert === 'all' ? ' chip-active' : '')}
            onClick={() => updateParams({ cert: null })}
          >
            All
          </button>
          {certMetaList.map((meta) => (
            <button
              key={meta.slug}
              type="button"
              className={'chip' + (cert === meta.slug ? ' chip-active' : '')}
              onClick={() => updateParams({ cert: meta.slug })}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.accent }} />
              {meta.shortName}
              <span className="text-[10px] opacity-70">{countByCert(meta.slug)}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Type
          </span>
          {TYPE_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={'chip' + (type === option.value ? ' chip-active' : '')}
              onClick={() => updateParams({ type: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-300">{shown.length}</span> of{' '}
            <span className="font-semibold text-slate-300">{filtered.length}</span> blocks
            {hasActiveFilters ? ' (filtered)' : ''}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={'chip' + (hideDone ? ' chip-active' : '')}
              onClick={() => setHideDone((value) => !value)}
            >
              <IconCheck size={12} />
              Hide completed
            </button>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------- Grid */}
      {shown.length > 0 ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((item) => (
              <ChallengeCard key={item.id} item={item} />
            ))}
          </div>

          {visible < filtered.length && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setVisible((value) => value + PAGE_SIZE)}
                className="btn btn-secondary"
              >
                Load {Math.min(PAGE_SIZE, filtered.length - visible)} more
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card mt-6 p-10 text-center">
          <p className="text-sm font-semibold text-slate-200">No blocks match your filters.</p>
          <p className="mt-2 text-sm text-slate-400">
            Try a different keyword — or clear the filters to see all {catalog.length} practice
            blocks.
          </p>
          <button
            type="button"
            className="btn btn-secondary mt-5"
            onClick={() => {
              setSearchParams({}, { replace: true })
              setHideDone(false)
            }}
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
