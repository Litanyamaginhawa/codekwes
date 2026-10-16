import { useRef, useState } from 'react'
import type { LessonChallenge } from '../../lib/lessons'
import { runChallengeTests, buildPreviewDoc, type HintResult } from '../../lib/lessonRunner'
import { renderInlineMarkdown } from '../../lib/markdown'
import CodePane from '../playground/CodePane'
import { IconCheck, IconClose, IconLoader, IconRefresh } from '../icons'

type BottomTab = 'preview' | 'tests'

const TAB_ACTIVE = 'rounded-lg px-3 py-1.5 text-xs font-semibold bg-white/10 text-white'
const TAB_IDLE = 'rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-300'

interface ChallengeViewProps {
  challenge: LessonChallenge
  code: string
  onCodeChange: (code: string) => void
  onResetToSeed: () => void
  passed: boolean
  onPassed: () => void
}

/**
 * The workshop/lab workbench: editor, live preview and the freeCodeCamp test
 * runner. Tests execute against the code exactly as typed.
 */
export default function ChallengeView({
  challenge,
  code,
  onCodeChange,
  onResetToSeed,
  passed,
  onPassed,
}: ChallengeViewProps) {
  const isJs = challenge.seedLang === 'js'
  const paneLang: 'html' | 'js' = isJs ? 'js' : 'html'

  const frameRef = useRef<HTMLIFrameElement | null>(null)
  const pendingRunRef = useRef(false)

  const [srcDoc, setSrcDoc] = useState(isJs ? '' : buildPreviewDoc(code))
  const [runId, setRunId] = useState(0)
  const [tab, setTab] = useState<BottomTab>('preview')
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<HintResult[] | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const executeTests = async () => {
    setRunning(true)
    try {
      const outcome = await runChallengeTests({
        challenge,
        code,
        frame: isJs ? null : frameRef.current,
      })
      setResults(outcome.results)
      setLogs(outcome.logs)
      if (outcome.results.length > 0 && outcome.results.every((entry) => entry.pass)) {
        onPassed()
      }
    } finally {
      setRunning(false)
    }
  }

  const handleCheck = () => {
    if (running) return
    setResults(null)
    setLogs([])
    setTab('tests')
    if (isJs) {
      void executeTests()
    } else {
      // Reload the preview with the latest code, then run tests once the
      // iframe has finished rendering it.
      pendingRunRef.current = true
      setSrcDoc(buildPreviewDoc(code))
      setRunId((n) => n + 1)
    }
  }

  const handleFrameLoad = () => {
    if (pendingRunRef.current) {
      pendingRunRef.current = false
      void executeTests()
    }
  }

  const handleReset = () => {
    if (!window.confirm('Reset this step back to the starting code?')) return
    onResetToSeed()
    setResults(null)
    setLogs([])
    setTab('preview')
    if (!isJs) {
      setSrcDoc(buildPreviewDoc(challenge.seed))
      setRunId((n) => n + 1)
    }
  }

  const totalHints = challenge.hints.length
  const passedCount = results ? results.filter((entry) => entry.pass).length : 0

  const testsPanel = (
    <div className="h-full overflow-y-auto p-3">
      {logs.length > 0 && (
        <div className="mb-3 rounded-lg border border-white/10 bg-ink-950/60 p-3">
          <p className="mb-1.5 font-mono text-[11px] text-slate-500">Console output</p>
          <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-slate-300">
            {logs.join('\n')}
          </pre>
        </div>
      )}
      {running ? (
        <div className="flex items-center gap-2 p-4 text-xs text-slate-400">
          <IconLoader size={14} />
          Running {totalHints} tests…
        </div>
      ) : results === null ? (
        <p className="p-4 text-xs leading-relaxed text-slate-500">
          {totalHints > 0
            ? `Press “Check your code” to run the ${totalHints} tests for this step.`
            : 'This step has no automated tests — use the preview to check your work.'}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {results.map((entry, index) => (
            <li key={index} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
              <div className="flex items-start gap-2">
                {entry.pass ? (
                  <IconCheck size={14} className="mt-0.5 shrink-0 text-mint-400" />
                ) : (
                  <IconClose size={14} className="mt-0.5 shrink-0 text-rose-400" />
                )}
                <span
                  className="text-xs leading-relaxed text-slate-300"
                  dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(entry.text) }}
                />
              </div>
              {!entry.pass && entry.message && (
                <p className="mt-1.5 break-words pl-6 font-mono text-[11px] leading-relaxed text-rose-300/90">
                  {entry.message}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <div className="flex min-h-0 flex-col gap-4">
      {passed && (
        <div className="rounded-xl border border-mint-400/30 bg-mint-400/10 px-4 py-2.5 text-xs font-semibold text-mint-300">
          Step passed — use “Next” to continue.
        </div>
      )}

      {/* ------------------------------------------------ Editor */}
      <div className="card flex min-h-[320px] flex-[3] flex-col overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
          <span className="font-mono text-[11px] text-slate-500">
            {paneLang === 'js' ? 'script.js' : 'index.html'}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={handleReset} className="btn btn-ghost btn-sm">
              <IconRefresh size={13} />
              Reset
            </button>
            <button
              type="button"
              onClick={handleCheck}
              className="btn btn-primary btn-sm"
              disabled={running || totalHints === 0}
            >
              {running ? <IconLoader size={13} /> : <IconCheck size={13} />}
              Check your code
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <CodePane lang={paneLang} value={code} onChange={onCodeChange} />
        </div>
      </div>

      {/* ---------------------------------------------- Preview / tests */}
      <div className="card flex min-h-[260px] flex-[2] flex-col overflow-hidden">
        <div className="flex items-center gap-1 border-b border-white/10 px-2 py-1.5">
          <button type="button" onClick={() => setTab('preview')} className={tab === 'preview' ? TAB_ACTIVE : TAB_IDLE}>
            Preview
          </button>
          <button type="button" onClick={() => setTab('tests')} className={tab === 'tests' ? TAB_ACTIVE : TAB_IDLE}>
            Tests {results ? `(${passedCount}/${totalHints})` : `(${totalHints})`}
          </button>
          {tab === 'preview' && !isJs && (
            <button
              type="button"
              onClick={() => {
                setSrcDoc(buildPreviewDoc(code))
                setRunId((n) => n + 1)
              }}
              className="btn btn-ghost btn-sm ml-auto"
            >
              <IconRefresh size={13} />
              Refresh
            </button>
          )}
        </div>
        <div className="min-h-0 flex-1">
          {isJs ? (
            tab === 'preview' ? (
              <div className="flex h-full items-center justify-center p-6 text-center text-xs leading-relaxed text-slate-500">
                JavaScript challenge — press “Check your code” to run the tests against your
                script.
              </div>
            ) : (
              testsPanel
            )
          ) : (
            <>
              {/* The preview iframe stays mounted on the tests tab: tests run
                  against the freshly reloaded frame as soon as it loads. */}
              <div className={tab === 'preview' ? 'h-full' : 'hidden'}>
                <iframe
                  key={runId}
                  ref={frameRef}
                  title="Lesson preview"
                  sandbox="allow-scripts allow-same-origin allow-modals"
                  srcDoc={srcDoc}
                  onLoad={handleFrameLoad}
                  className="h-full min-h-[240px] w-full bg-white"
                />
              </div>
              <div className={tab === 'tests' ? 'h-full' : 'hidden'}>{testsPanel}</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
