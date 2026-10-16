import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { TEMPLATES } from '../data/templates'
import { useSnippets } from '../hooks/useSnippets'
import { useAuth } from '../contexts/AuthContext'
import { formatDate } from '../lib/storage'
import type { Snippet } from '../types'
import CodePane, { type PaneLang } from '../components/playground/CodePane'
import PreviewPane from '../components/playground/PreviewPane'
import ConsolePane, { type ConsoleEntry } from '../components/playground/ConsolePane'
import {
  IconChevronRight,
  IconLoader,
  IconPlay,
  IconRefresh,
  IconSave,
  IconTrash,
} from '../components/icons'

const TABS: { id: PaneLang; label: string }[] = [
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'js', label: 'JS' },
]

/**
 * Injected into the preview iframe before the user's script. It forwards
 * console calls and runtime errors to the parent window via postMessage.
 */
const CONSOLE_BRIDGE = `<script>
(function () {
  function serialize(value) {
    try {
      if (typeof value === 'undefined') return 'undefined';
      if (value === null) return 'null';
      if (typeof value === 'function') return '[function ' + (value.name || 'anonymous') + ']';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    } catch (error) {
      return '[unserializable]';
    }
  }
  function send(level, args) {
    parent.postMessage(
      {
        source: 'codekwes-preview',
        level: level,
        text: Array.prototype.slice.call(args).map(serialize).join(' ')
      },
      '*'
    );
  }
  ['log', 'info', 'warn', 'error'].forEach(function (method) {
    var original = console[method];
    console[method] = function () {
      send(method, arguments);
      original.apply(console, arguments);
    };
  });
  window.addEventListener('error', function (event) {
    send('error', [event.message + (event.lineno ? ' (line ' + event.lineno + ')' : '')]);
  });
  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason && event.reason.message ? event.reason.message : String(event.reason);
    send('error', ['Unhandled promise rejection: ' + reason]);
  });
})();
</script>`

function buildSrcDoc(html: string, css: string, js: string): string {
  // Prevent the user's code from prematurely closing its <script> tag.
  const safeJs = js.replace(/<\/script/gi, '<\\/script')
  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    '<style>' + css + '</style>',
    '</head>',
    '<body>',
    html,
    CONSOLE_BRIDGE,
    '<script>',
    safeJs,
    '</script>',
    '</body>',
    '</html>',
  ].join('\n')
}

export default function PlaygroundPage() {
  const location = useLocation()
  const initialSnippet = (location.state as { snippet?: Snippet } | null)?.snippet ?? null

  const { user, configured } = useAuth()
  const { snippets, cloud, saveSnippet, deleteSnippet } = useSnippets()

  const [templateId, setTemplateId] = useState(TEMPLATES[0].id)
  const [html, setHtml] = useState(initialSnippet?.html ?? TEMPLATES[0].html)
  const [css, setCss] = useState(initialSnippet?.css ?? TEMPLATES[0].css)
  const [js, setJs] = useState(initialSnippet?.js ?? TEMPLATES[0].js)
  const [activeTab, setActiveTab] = useState<PaneLang>('html')
  const [autorun, setAutorun] = useState(true)
  const [runId, setRunId] = useState(0)
  const [entries, setEntries] = useState<ConsoleEntry[]>([])

  const [title, setTitle] = useState(initialSnippet?.title ?? '')
  const [currentSnippetId, setCurrentSnippetId] = useState<string | null>(initialSnippet?.id ?? null)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [showSnippets, setShowSnippets] = useState(Boolean(initialSnippet))

  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const entryIdRef = useRef(1)

  const run = useCallback(() => {
    setEntries([])
    setRunId((value) => value + 1)
  }, [])

  // Rebuild the document only when a run is requested, so that with autorun
  // disabled the preview updates exactly when the user hits Run.
  const srcDoc = useMemo(
    () => buildSrcDoc(html, css, js),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [runId],
  )

  // Autorun: debounce edits and refresh the preview.
  useEffect(() => {
    if (!autorun) return
    const timer = window.setTimeout(run, 900)
    return () => window.clearTimeout(timer)
  }, [html, css, js, autorun, run])

  // Ctrl/Cmd + Enter runs the code.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault()
        run()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [run])

  // Receive console output from the sandboxed preview iframe.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { source?: string; level?: string; text?: string } | null
      if (!data || data.source !== 'codekwes-preview') return
      if (iframeRef.current && event.source !== iframeRef.current.contentWindow) return
      const level: ConsoleEntry['level'] =
        data.level === 'info' || data.level === 'warn' || data.level === 'error'
          ? data.level
          : 'log'
      setEntries((prev) => [...prev, { id: entryIdRef.current++, level, text: data.text ?? '' }])
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const applyTemplate = (id: string) => {
    const template = TEMPLATES.find((entry) => entry.id === id) ?? TEMPLATES[0]
    setTemplateId(template.id)
    setHtml(template.html)
    setCss(template.css)
    setJs(template.js)
    setTitle('')
    setCurrentSnippetId(null)
  }

  const handleReset = () => {
    if (window.confirm('Reload the selected template? Your current code will be replaced.')) {
      applyTemplate(templateId)
    }
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    const saved = await saveSnippet({
      id: currentSnippetId ?? undefined,
      title: title || 'Untitled snippet',
      html,
      css,
      js,
    })
    setSaving(false)
    if (saved) {
      setCurrentSnippetId(saved.id)
      setTitle(saved.title)
      setSavedFlash(true)
      window.setTimeout(() => setSavedFlash(false), 2000)
    }
  }

  const handleLoad = (snippet: Snippet) => {
    setHtml(snippet.html)
    setCss(snippet.css)
    setJs(snippet.js)
    setTitle(snippet.title)
    setCurrentSnippetId(snippet.id)
    setShowSnippets(false)
    run()
  }

  const handleDelete = async (snippet: Snippet) => {
    if (!window.confirm(`Delete "${snippet.title}"? This cannot be undone.`)) return
    await deleteSnippet(snippet.id)
    if (currentSnippetId === snippet.id) {
      setCurrentSnippetId(null)
    }
  }

  const storageNote = cloud
    ? 'Saved snippets sync to your account.'
    : user
      ? 'Stored in this browser.'
      : configured
        ? 'Log in to sync snippets to the cloud — right now they stay in this browser.'
        : 'Stored in this browser (local mode).'

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Code playground</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            A sandbox for HTML, CSS and JavaScript with live preview and console. Warm up before a
            freeCodeCamp workshop, or experiment between{' '}
            <Link to="/practice" className="link">
              practice blocks
            </Link>
            . <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300">Ctrl</kbd>{' '}
            +{' '}
            <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300">Enter</kbd>{' '}
            runs your code.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------- Toolbar */}
      <div className="card mt-6 flex flex-wrap items-center gap-3 p-4">
        <label className="flex items-center gap-2 text-xs text-slate-400">
          Template
          <select
            value={templateId}
            onChange={(event) => applyTemplate(event.target.value)}
            className="input w-44 py-1.5"
          >
            {TEMPLATES.map((template) => (
              <option key={template.id} value={template.id} className="bg-ink-900">
                {template.name}
              </option>
            ))}
          </select>
        </label>

        <button type="button" onClick={handleReset} className="btn btn-ghost btn-sm">
          <IconRefresh size={14} />
          Reload template
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAutorun((value) => !value)}
            className={'chip' + (autorun ? ' chip-active' : '')}
          >
            Auto-run {autorun ? 'on' : 'off'}
          </button>
          <button type="button" onClick={run} className="btn btn-primary btn-sm">
            <IconPlay size={14} />
            Run
          </button>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 border-t border-white/5 pt-3 sm:w-auto sm:border-0 sm:pt-0">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Snippet name…"
            className="input w-full sm:w-52"
            aria-label="Snippet name"
          />
          <button
            type="button"
            onClick={() => void handleSave()}
            className="btn btn-secondary btn-sm"
            disabled={saving}
          >
            {saving ? <IconLoader size={14} /> : <IconSave size={14} />}
            {currentSnippetId ? 'Update' : 'Save'}
          </button>
          {savedFlash && <span className="text-xs font-semibold text-mint-400">Saved</span>}
        </div>
      </div>

      {/* ------------------------------------------------------ Snippets */}
      <div className="card mt-4 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSnippets((value) => !value)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <IconChevronRight
              size={16}
              className={'text-slate-500 transition-transform ' + (showSnippets ? 'rotate-90' : '')}
            />
            Saved snippets ({snippets.length})
          </span>
          <span className="text-xs text-slate-500">{storageNote}</span>
        </button>

        {showSnippets && (
          <div className="border-t border-white/5 px-4 py-3">
            {snippets.length === 0 ? (
              <p className="py-2 text-xs text-slate-500">
                Nothing saved yet. Write some code and hit “Save” to keep it here.
              </p>
            ) : (
              <ul className="divide-y divide-white/5">
                {snippets.map((snippet) => (
                  <li key={snippet.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-200">{snippet.title}</p>
                      <p className="text-[11px] text-slate-500">Updated {formatDate(snippet.updatedAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleLoad(snippet)}
                        className="btn btn-secondary btn-sm"
                      >
                        Load
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(snippet)}
                        className="btn btn-ghost btn-sm text-rose-400 hover:text-rose-300"
                        aria-label={`Delete ${snippet.title}`}
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------- Grid */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Editor */}
        <div className="card flex h-[440px] flex-col overflow-hidden lg:h-[620px]">
          <div className="flex items-center gap-1 border-b border-white/10 px-2 py-1.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ' +
                  (activeTab === tab.id
                    ? 'bg-white/10 text-white'
                    : 'text-slate-500 hover:text-slate-300')
                }
              >
                {tab.label}
              </button>
            ))}
            <span className="ml-auto pr-2 font-mono text-[11px] text-slate-600">
              index.{activeTab === 'js' ? 'js' : activeTab}
            </span>
          </div>
          <div className="min-h-0 flex-1">
            {activeTab === 'html' && <CodePane lang="html" value={html} onChange={setHtml} />}
            {activeTab === 'css' && <CodePane lang="css" value={css} onChange={setCss} />}
            {activeTab === 'js' && <CodePane lang="js" value={js} onChange={setJs} />}
          </div>
        </div>

        {/* Preview + console */}
        <div className="flex flex-col gap-4 lg:h-[620px]">
          <div className="card flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Live preview
              </span>
              <span className="text-[11px] text-slate-500">
                Sandboxed — runs entirely in your browser
              </span>
            </div>
            <div className="min-h-[300px] flex-1">
              <PreviewPane ref={iframeRef} srcDoc={srcDoc} runId={runId} />
            </div>
          </div>

          <div className="card h-56 overflow-hidden">
            <ConsolePane entries={entries} onClear={() => setEntries([])} />
          </div>
        </div>
      </div>
    </div>
  )
}
