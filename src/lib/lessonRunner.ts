/**
 * Executes freeCodeCamp lesson tests in the browser.
 *
 * Mirrors the two evaluators freeCodeCamp ships in
 * `@freecodecamp/curriculum-helpers`:
 *
 * - JavaScript challenges (pure `js` seeds): per test, evaluate
 *   `hooks.beforeEach; <user code>; <test>` inside one scope, so tests share
 *   the learner's declarations, `code`/`editableContents` are visible, and
 *   console spies captured by `--before-each--` see top-level logging.
 * - DOM challenges (HTML/CSS seeds and workshops): the learner's markup runs
 *   in the preview iframe, so each test is compiled through the iframe's own
 *   `Function` constructor — its realm contains the learner's script globals
 *   and a live `document`.
 *
 * Tests are chai `assert` expressions; `__helpers` mirrors FCC's helper
 * global (CSSHelp, Explorer, spyOn, ...).
 */
import { assert } from 'chai'
import type { LessonChallenge, LessonHint } from './lessons'
import { createLessonHelpers, type LessonHelpers } from './lessonHelpers'

export interface HintResult {
  pass: boolean
  text: string
  message?: string
}

export interface RunOutcome {
  results: HintResult[]
  logs: string[]
}

const TEST_TIMEOUT_MS = 8000
const MAX_LOGS = 200

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error('Test timed out after ' + ms + 'ms'))
    }, ms)
    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        window.clearTimeout(timer)
        reject(error)
      },
    )
  })
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return String(error)
}

function formatLogArg(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null) {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

/** Captures console output during a run so the UI can show it. */
function captureConsole(logs: string[]): () => void {
  const original = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
  }
  const push = (args: unknown[]) => {
    if (logs.length >= MAX_LOGS) return
    logs.push(args.map(formatLogArg).join(' '))
  }
  console.log = (...args: unknown[]) => {
    push(args)
    original.log.apply(console, args)
  }
  console.info = (...args: unknown[]) => {
    push(args)
    original.info.apply(console, args)
  }
  console.warn = (...args: unknown[]) => {
    push(args)
    original.warn.apply(console, args)
  }
  console.error = (...args: unknown[]) => {
    push(args)
    original.error.apply(console, args)
  }
  return () => {
    console.log = original.log
    console.info = original.info
    console.warn = original.warn
    console.error = original.error
  }
}

// ---------------------------------------------------------------------------
// Preview sandbox
// ---------------------------------------------------------------------------

/**
 * In-memory `localStorage` for previews. FCC mocks local storage in its test
 * frame; mirroring that keeps learner code (todo app, bookmark manager) off
 * CodeKwes's own storage and makes tests deterministic.
 */
const SANDBOX_PRELUDE =
  '<script>/* codekwes-sandbox */\n' +
  '(function () {\n' +
  '  try {\n' +
  '    var store = Object.create(null);\n' +
  '    var mock = {\n' +
  '      getItem: function (key) {\n' +
  '        var name = String(key);\n' +
  '        return Object.prototype.hasOwnProperty.call(store, name) ? store[name] : null;\n' +
  '      },\n' +
  '      setItem: function (key, value) {\n' +
  '        store[String(key)] = String(value);\n' +
  '      },\n' +
  '      removeItem: function (key) {\n' +
  '        delete store[String(key)];\n' +
  '      },\n' +
  '      clear: function () {\n' +
  '        store = Object.create(null);\n' +
  '      },\n' +
  '      key: function (index) {\n' +
  '        var keys = Object.keys(store);\n' +
  '        return index >= 0 && index < keys.length ? keys[index] : null;\n' +
  '      }\n' +
  '    };\n' +
  '    Object.defineProperty(mock, "length", {\n' +
  '      get: function () { return Object.keys(store).length; }\n' +
  '    });\n' +
  '    Object.defineProperty(window, "localStorage", {\n' +
  '      configurable: true,\n' +
  '      get: function () { return mock; }\n' +
  '    });\n' +
  '  } catch (error) { /* keep the real localStorage if it cannot be replaced */ }\n' +
  '})();\n' +
  '</script>'

/** Wraps learner markup for the preview iframe, adding the sandbox prelude. */
export function buildPreviewDoc(code: string): string {
  if (code.includes('codekwes-sandbox')) return code
  const headOpen = /<head[^>]*>/i.exec(code)
  if (headOpen) {
    const at = headOpen.index + headOpen[0].length
    return code.slice(0, at) + '\n' + SANDBOX_PRELUDE + code.slice(at)
  }
  const doctype = /<!doctype[^>]*>/i.exec(code)
  if (doctype) {
    const at = doctype.index + doctype[0].length
    return code.slice(0, at) + '\n' + SANDBOX_PRELUDE + code.slice(at)
  }
  return SANDBOX_PRELUDE + '\n' + code
}

/**
 * The learner-editable region (`--fcc-editable-region--` in FCC seeds) of the
 * current code, tracked dynamically the way FCC's editor decoration does: the
 * unchanged text before and after the region pins its position, so edits
 * inside the region (including deleting it entirely) grow or shrink the window
 * exactly like Monaco's `AlwaysGrowsWhenTypingAtEdges` region tracking, and
 * injected preview blocks never leak into it.
 */
export function editableContentsOf(challenge: LessonChallenge, code: string): string {
  const region = challenge.region
  if (!region) return code
  const [start, end] = region
  const seedLines = challenge.seed.split('\n')
  const lines = code.split('\n')
  if (start < 0 || start > end || end > seedLines.length) return code
  const prefixLen = start
  const suffixLen = seedLines.length - end
  if (lines.length >= prefixLen + suffixLen) {
    let stable = true
    for (let i = 0; i < prefixLen && stable; i += 1) {
      if (lines[i] !== seedLines[i]) stable = false
    }
    for (let i = 0; i < suffixLen && stable; i += 1) {
      if (lines[lines.length - 1 - i] !== seedLines[seedLines.length - 1 - i]) stable = false
    }
    if (stable) return lines.slice(prefixLen, lines.length - suffixLen).join('\n')
  }
  // The learner edited outside the region as well; fall back to the seed's
  // static bounds as a best effort.
  if (start > lines.length || end > lines.length) return code
  return lines.slice(start, end).join('\n')
}

/** The class that marks the css "file" injected into previews (FCC's own). */
const INJECTED_STYLE_OPEN = '<style class="fcc-injected-styles">'

/**
 * The `code` parameter tests receive: FCC's `sources.index` joins the raw
 * contents of each challenge file (`index.html`, `styles.css`, `script.js`)
 * with newlines, so `code.slice(code.indexOf('</html>'))` sees the plain css
 * and the `--fcc-editable-region--` html expects no injected markup. Our
 * single-pane documents wrap the css "file" in
 * `<style class="fcc-injected-styles">` tags for the preview (FCC's own
 * preview injects the same class), which tests like cafe-menu's "no style tags
 * after </html>" regex must not see, so the style wrapper is always unwrapped.
 * The js "file" keeps its `<script>` wrapper when it carries learner code —
 * static-analysis tests extract it from the document (our Explorer port has
 * no FCC's error-recovering TS parser) — but an EMPTY wrapper is dropped so
 * tests asking the learner to add an empty `script` element cannot false-pass.
 */
export function codeForTests(code: string): string {
  const styleIdx = code.indexOf(INJECTED_STYLE_OPEN)
  if (styleIdx === -1) return code
  const html = code.slice(0, styleIdx).replace(/\n$/, '')
  let rest = code.slice(styleIdx + INJECTED_STYLE_OPEN.length)
  const styleClose = rest.indexOf('\n</style>')
  if (styleClose === -1) return code
  const css = rest.slice(0, styleClose).replace(/^\n/, '')
  rest = rest.slice(styleClose + '\n</style>'.length)
  const parts = [html, css]
  // The js "file" wrapper, when present, is the trailing `<script>` block.
  const scriptIdx = rest.indexOf('<script>\n')
  if (scriptIdx !== -1) {
    const scriptClose = rest.indexOf('\n</script>', scriptIdx + '<script>\n'.length)
    if (scriptClose !== -1) {
      const js = rest.slice(scriptIdx + '<script>\n'.length, scriptClose)
      if (js.trim()) parts.push(rest.slice(scriptIdx, scriptClose + '\n</script>'.length))
    }
  }
  return parts.join('\n')
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

function hookSetup(challenge: LessonChallenge): string {
  return [challenge.beforeAll, challenge.beforeEach].filter(Boolean).join('\n;\n')
}

/** Asynchronous IIFE wrapper, same shape as FCC's createAsyncIife. */
function asyncIife(code: string): string {
  return '(' + 'async () => {' + code + ';\n})();'
}

export async function runChallengeTests(options: {
  challenge: LessonChallenge
  code: string
  frame: HTMLIFrameElement | null
}): Promise<RunOutcome> {
  const { challenge, code, frame } = options
  const jsMode = challenge.seedLang === 'js'
  const helpers = createLessonHelpers()
  const frameWindow = frame ? frame.contentWindow : null
  const frameDocument = frame ? frame.contentDocument : null
  // Tests must run in the iframe's realm so script globals the learner typed
  // inside <script> (and the live document) are visible.
  const realmFunction =
    frameWindow && typeof (frameWindow as { Function?: unknown }).Function === 'function'
      ? (frameWindow as unknown as { Function: FunctionConstructor }).Function
      : null

  const logs: string[] = []
  const restoreConsole = captureConsole(logs)
  const results: HintResult[] = []
  try {
    for (const hint of challenge.hints) {
      results.push(
        await runSingleHint({
          hint,
          challenge,
          code,
          jsMode,
          helpers,
          realmFunction,
          frameWindow,
          frameDocument,
        }),
      )
    }
  } finally {
    restoreConsole()
  }
  return { results, logs }
}

async function runSingleHint(options: {
  hint: LessonHint
  challenge: LessonChallenge
  code: string
  jsMode: boolean
  helpers: LessonHelpers
  realmFunction: FunctionConstructor | null
  frameWindow: Window | null
  frameDocument: Document | null
}): Promise<HintResult> {
  const { hint, challenge, code, jsMode, helpers, realmFunction, frameWindow, frameDocument } =
    options
  try {
    const setup = hookSetup(challenge)
    const editableContents = editableContentsOf(challenge, code)
    const testCode = codeForTests(code)
    if (jsMode) {
      // FCC's JavaScript evaluator: beforeEach, the learner's code and the test
      // all evaluate in one scope (so the test sees every declaration), with
      // `code` and `editableContents` visible. A code error before the flag is
      // set logs and still runs the test alone.
      const test = asyncIife(hint.test)
      const payload =
        (setup ? setup + ';\n' : '') +
        testCode +
        ';\n__userCodeWasExecuted = true;\n' +
        test +
        ';'
      const source =
        '"use strict";\n' +
        'let __userCodeWasExecuted = false;\n' +
        'try {\n' +
        'return eval(__payload);\n' +
        '} catch (err) {\n' +
        'if (__userCodeWasExecuted) throw err;\n' +
        'console.error(err);\n' +
        'return eval(__test);\n' +
        '}\n'
      const runner = new Function(
        'assert',
        '__helpers',
        'document',
        'window',
        'code',
        'editableContents',
        '__payload',
        '__test',
        source,
      )
      await withTimeout(
        Promise.resolve(
          // FCC's JavaScript evaluator runs tests in the app's own realm
          // (`document`/`window` available), so pure-JS tests see the page
          // globals rather than the preview iframe's.
          runner(assert, helpers, document, window, testCode, editableContents, payload, test),
        ),
        TEST_TIMEOUT_MS,
      )
    } else {
      const Ctor = realmFunction ?? Function
      const testBody = setup ? setup + ';\n' + hint.test : hint.test
      const source = '"use strict";\nreturn ' + asyncIife(testBody)
      const runner = new Ctor(
        'assert',
        '__helpers',
        'getComputedStyle',
        'code',
        'editableContents',
        'document',
        'window',
        source,
      )
      const computed = frameWindow
        ? frameWindow.getComputedStyle.bind(frameWindow)
        : window.getComputedStyle
      await withTimeout(
        Promise.resolve(
          runner(assert, helpers, computed, testCode, editableContents, frameDocument, frameWindow),
        ),
        TEST_TIMEOUT_MS,
      )
    }
    return { pass: true, text: hint.text }
  } catch (error) {
    return { pass: false, text: hint.text, message: messageOf(error) }
  }
}
