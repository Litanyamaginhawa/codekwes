import { useMemo, useState } from 'react'
import type { LessonArticle } from '../../lib/lessons'
import { renderMarkdown, splitInteractive } from '../../lib/markdown'
import CodePane, { type PaneLang } from '../playground/CodePane'
import { IconCheck, IconPlay } from '../icons'

function toPaneLang(lang: string): PaneLang {
  if (lang === 'js' || lang === 'javascript') return 'js'
  if (lang === 'css') return 'css'
  return 'html'
}

/** Wrap a snippet so any of the three languages can be previewed. */
function wrapPreview(code: string, lang: string): string {
  if (lang === 'css') {
    return (
      '<!doctype html><html><head><style>' +
      code +
      '</style></head><body style="font-family: sans-serif">' +
      '<h1>Styled heading</h1><p>Sample text with a <a href="#">link</a>.</p></body></html>'
    )
  }
  if (lang === 'js' || lang === 'javascript') {
    const safe = code.replace(/<\/script/gi, '<\\/script')
    return '<!doctype html><html><body><script>' + safe + '</script></body></html>'
  }
  return code
}

/** A small runnable editor embedded inside lecture content. */
function InteractiveBlock({ lang, code }: { lang: string; code: string }) {
  const [value, setValue] = useState(code)
  const [srcDoc, setSrcDoc] = useState<string | null>(null)
  const [runId, setRunId] = useState(0)

  const run = () => {
    setSrcDoc(wrapPreview(value, lang))
    setRunId((n) => n + 1)
  }

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-2">
        <span className="font-mono text-[11px] text-slate-500">Try it yourself</span>
        <button type="button" onClick={run} className="btn btn-secondary btn-sm">
          <IconPlay size={12} />
          {srcDoc === null ? 'Run code' : 'Run again'}
        </button>
      </div>
      <div className="h-48">
        <CodePane lang={toPaneLang(lang)} value={value} onChange={setValue} />
      </div>
      {srcDoc !== null && (
        <iframe
          key={runId}
          title="Interactive example"
          sandbox="allow-scripts allow-modals"
          srcDoc={srcDoc}
          className="h-52 w-full border-t border-white/10 bg-white"
        />
      )}
    </div>
  )
}

interface ArticleViewProps {
  article: LessonArticle
  done: boolean
  onToggleDone: () => void
}

/** Renders a lecture or review page, converting embedded editors into
 *  runnable blocks and the rest into styled markdown. */
export default function ArticleView({ article, done, onToggleDone }: ArticleViewProps) {
  const segments = useMemo(() => splitInteractive(article.content), [article.content])

  return (
    <div>
      {segments.map((segment, index) =>
        segment.type === 'markdown' ? (
          <div
            key={index}
            className="lesson-content"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(segment.markdown ?? '') }}
          />
        ) : (
          <InteractiveBlock key={index} lang={segment.lang ?? 'html'} code={segment.code ?? ''} />
        ),
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
        <button
          type="button"
          onClick={onToggleDone}
          className={done ? 'btn btn-secondary' : 'btn btn-primary'}
        >
          <IconCheck size={15} className={done ? 'text-mint-400' : ''} />
          {done ? 'Read — tap to mark unread' : 'Mark as read'}
        </button>
        <span className="text-xs text-slate-500">
          {done ? 'Nice — this part is checked off.' : 'Reading counts toward this block’s progress.'}
        </span>
      </div>
    </div>
  )
}
