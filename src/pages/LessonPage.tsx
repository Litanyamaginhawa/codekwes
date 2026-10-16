import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCertMeta, getItem, TYPE_LABEL } from '../lib/catalog'
import { useProgress } from '../contexts/ProgressContext'
import {
  loadLessonBlock,
  loadLessonState,
  saveLessonState,
  type BlockLessonState,
  type LessonBlock,
} from '../lib/lessons'
import { renderMarkdown } from '../lib/markdown'
import ArticleView from '../components/lesson/ArticleView'
import ChallengeView from '../components/lesson/ChallengeView'
import QuizView from '../components/lesson/QuizView'
import {
  IconChevronLeft,
  IconChevronRight,
  IconExternal,
  IconLoader,
} from '../components/icons'

/**
 * In-site lesson player. Plays freeCodeCamp workshops, labs, lectures,
 * reviews and quizzes that were converted into lesson JSON by the
 * fetch script. Step progress and drafts live in localStorage.
 */
export default function LessonPage() {
  const { certSlug = '', blockSlug = '' } = useParams()
  const catalogItem = getItem(certSlug, blockSlug)
  const cert = getCertMeta(certSlug)
  const { isDone, toggle } = useProgress()

  const [block, setBlock] = useState<LessonBlock | null | undefined>(undefined)
  const [state, setState] = useState<BlockLessonState>({ done: [], last: 0, drafts: {} })
  const [current, setCurrent] = useState(0)

  // Load the block's lesson data and restore local progress.
  useEffect(() => {
    let active = true
    setBlock(undefined)
    loadLessonBlock(blockSlug).then((data) => {
      if (!active) return
      setBlock(data)
      const stored = loadLessonState(blockSlug)
      setState(stored)
      setCurrent(data && stored.last > 0 && stored.last < data.items.length ? stored.last : 0)
    })
    return () => {
      active = false
    }
  }, [blockSlug])

  // Persist progress and drafts (debounced).
  useEffect(() => {
    if (!block) return
    const timer = window.setTimeout(() => saveLessonState(blockSlug, state), 350)
    return () => window.clearTimeout(timer)
  }, [state, block, blockSlug])

  const items = block ? block.items : []
  const total = items.length
  const item = items[current]

  const currentCode = useMemo(() => {
    if (!item || item.kind !== 'challenge') return ''
    return state.drafts[String(current)] ?? item.seed
  }, [item, state.drafts, current])

  // Completing every step also completes the block in the progress tracker.
  const blockId = catalogItem ? catalogItem.id : ''
  const doneCount = state.done.length
  useEffect(() => {
    if (!block || !blockId || total === 0) return
    if (doneCount >= total && !isDone(blockId)) void toggle(blockId)
  }, [doneCount, total, block, blockId, isDone, toggle])

  const goTo = (index: number) => {
    if (total === 0) return
    const clamped = Math.max(0, Math.min(total - 1, index))
    setCurrent(clamped)
    setState((prev) => ({ ...prev, last: clamped }))
    window.scrollTo({ top: 0 })
  }

  const markDone = (index: number) => {
    setState((prev) =>
      prev.done.includes(index) ? prev : { ...prev, done: [...prev.done, index] },
    )
  }

  const toggleDone = (index: number) => {
    setState((prev) => ({
      ...prev,
      done: prev.done.includes(index)
        ? prev.done.filter((n) => n !== index)
        : [...prev.done, index],
    }))
  }

  const handleCodeChange = (value: string) => {
    setState((prev) => ({ ...prev, drafts: { ...prev.drafts, [String(current)]: value } }))
  }

  const handleResetToSeed = () => {
    setState((prev) => {
      const drafts = { ...prev.drafts }
      delete drafts[String(current)]
      return { ...prev, drafts }
    })
  }

  if (!catalogItem || !cert) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-3xl font-bold text-slate-100">Block not found</h1>
        <p className="mt-3 text-sm text-slate-400">
          This practice block does not exist in the catalog.
        </p>
        <Link to="/practice" className="btn btn-primary mt-8">
          Back to the catalog
        </Link>
      </div>
    )
  }

  if (block === undefined) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 px-4 py-32 text-sm text-slate-400 sm:px-6">
        <IconLoader size={16} />
        Loading lesson…
      </div>
    )
  }

  if (block === null || total === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-slate-100">Not playable here yet</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          This block runs on a server-side or specialized runtime, so it cannot run inside
          CodeKwes yet. You can still solve it on freeCodeCamp.org — your catalog progress works
          either way.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={`/practice/${certSlug}/${blockSlug}`} className="btn btn-secondary">
            Back to block overview
          </Link>
          <a
            href={catalogItem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            Solve on freeCodeCamp
            <IconExternal size={15} />
          </a>
        </div>
      </div>
    )
  }

  const pct = Math.round((doneCount / total) * 100)
  const itemDone = state.done.includes(current)
  const allDone = doneCount >= total

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
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
        <Link
          to={`/practice/${certSlug}/${blockSlug}`}
          className="transition-colors hover:text-brand-300"
        >
          {catalogItem.title}
        </Link>
      </nav>

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold tracking-tight text-slate-100 sm:text-2xl">
              {catalogItem.title}
            </h1>
            <span className="chip cursor-default">{TYPE_LABEL[catalogItem.type]}</span>
            {itemDone && <span className="chip chip-active cursor-default">Step done</span>}
          </div>
          <div className="mt-3 flex max-w-xl items-center gap-3">
            <div className="bar flex-1">
              <div
                className="bar-fill"
                style={{
                  width: `${pct}%`,
                  background: 'linear-gradient(90deg, #38bdf8, #34d399)',
                }}
              />
            </div>
            <span className="shrink-0 text-[11px] text-slate-500">
              {doneCount}/{total} steps
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            disabled={current === 0}
            className="btn btn-secondary btn-sm"
          >
            <IconChevronLeft size={14} />
            Prev
          </button>
          <button
            type="button"
            onClick={() => goTo(current + 1)}
            disabled={current >= total - 1}
            className="btn btn-primary btn-sm"
          >
            Next
            <IconChevronRight size={14} />
          </button>
        </div>
      </div>

      {allDone && (
        <div className="mt-4 rounded-xl border border-mint-400/30 bg-mint-400/10 px-4 py-3 text-sm font-semibold text-mint-300">
          Block complete — all {total} steps done.{' '}
          <Link to={`/practice/${certSlug}/${blockSlug}`} className="link font-normal">
            Back to block overview
          </Link>
        </div>
      )}

      {/* Step picker */}
      {total > 1 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {items.map((entry, index) => {
            const done = state.done.includes(index)
            const active = index === current
            return (
              <button
                key={index}
                type="button"
                onClick={() => goTo(index)}
                title={entry.title}
                className={
                  'flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 text-[11px] font-semibold transition-colors ' +
                  (active
                    ? 'border-transparent bg-gradient-to-br from-brand-400 to-mint-400 text-ink-950'
                    : done
                      ? 'border-mint-400/30 bg-mint-400/10 text-mint-300'
                      : 'border-white/10 bg-white/[0.03] text-slate-500 hover:text-slate-300')
                }
              >
                {index + 1}
              </button>
            )
          })}
        </div>
      )}

      {/* Content */}
      {item.kind === 'challenge' ? (
        <div className="mt-5 grid gap-4 lg:h-[calc(100vh-19rem)] lg:min-h-[540px] lg:grid-cols-2">
          <div className="card min-h-0 overflow-y-auto p-6">
            <p className="eyebrow">
              Step {current + 1} of {total}
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-100">{item.title}</h2>
            <div
              className="lesson-content mt-4"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(item.description) }}
            />
          </div>
          <ChallengeView
            key={blockSlug + ':' + item.id}
            challenge={item}
            code={currentCode}
            onCodeChange={handleCodeChange}
            onResetToSeed={handleResetToSeed}
            passed={itemDone}
            onPassed={() => markDone(current)}
          />
        </div>
      ) : item.kind === 'article' ? (
        <div className="mx-auto mt-6 max-w-3xl">
          <div className="card p-6 sm:p-8">
            <p className="eyebrow">
              {TYPE_LABEL[catalogItem.type]} · Part {current + 1} of {total}
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-100">{item.title}</h2>
            <div className="mt-5">
              <ArticleView
                key={blockSlug + ':' + item.id}
                article={item}
                done={itemDone}
                onToggleDone={() => toggleDone(current)}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto mt-6 max-w-3xl">
          <QuizView
            key={blockSlug + ':' + item.id}
            quiz={item}
            done={itemDone}
            onPassed={() => markDone(current)}
          />
        </div>
      )}
    </div>
  )
}
