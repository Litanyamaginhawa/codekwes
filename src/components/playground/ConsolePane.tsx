import { useEffect, useRef } from 'react'

export interface ConsoleEntry {
  id: number
  level: 'log' | 'info' | 'warn' | 'error'
  text: string
}

const LEVEL_STYLE: Record<ConsoleEntry['level'], string> = {
  log: 'text-slate-300',
  info: 'text-brand-300',
  warn: 'text-amber-300',
  error: 'text-rose-400',
}

interface ConsolePaneProps {
  entries: ConsoleEntry[]
  onClear: () => void
}

export default function ConsolePane({ entries, onClear }: ConsolePaneProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [entries])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Console</span>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-500">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </span>
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] font-semibold text-slate-400 transition-colors hover:text-slate-200"
          >
            Clear
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-1">
        {entries.length === 0 ? (
          <p className="px-4 py-3 font-mono text-xs text-slate-600">
            console.log() output appears here.
          </p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="console-line">
              <span className={'shrink-0 ' + LEVEL_STYLE[entry.level]}>›</span>
              <span className={LEVEL_STYLE[entry.level]}>{entry.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
