/**
 * Browser port of freeCodeCamp's `__helpers` global, which challenge tests
 * rely on (`new __helpers.CSSHelp(document).getStyle(...)`,
 * `__helpers.spyOn(console, 'log')`, etc.).
 *
 * Mirrors `@freecodecamp/curriculum-helpers` (packages/helpers/lib/index.ts)
 * for the subset used by the workshops/labs shipped with CodeKwes.
 */
import { LessonExplorer, openExplorer } from './lessonExplorer'

type AnyFunction = (...args: never[]) => unknown

// ---------------------------------------------------------------------------
// Randomness
// ---------------------------------------------------------------------------

/** Deterministic stand-in for Math.random, used while running tests. */
export class RandomMocker {
  private original: () => number

  constructor() {
    this.original = Math.random
  }

  private createRandom(): () => number {
    let seed = 42
    const a = 1664525
    const c = 1013904223
    const mod = 2 ** 32
    return () => {
      seed = (a * seed + c) % mod
      return seed / mod
    }
  }

  mock(): void {
    globalThis.Math.random = this.createRandom()
  }

  restore(): void {
    globalThis.Math.random = this.original
  }
}

// ---------------------------------------------------------------------------
// Spies
// ---------------------------------------------------------------------------

export interface Spy<Args extends unknown[], Return> {
  (...args: Args): Return
  calls: Args[]
  returns: Return[]
  restore: () => void
}

function assertIsFunction(value: unknown): asserts value is AnyFunction {
  if (typeof value !== 'function') {
    throw new TypeError('spyOn can only be called on function properties')
  }
}

/** Creates a simple spy, inspired by Jest and Jasmine's spyOn. */
export function spyOn<Args extends unknown[], Return>(
  obj: Record<string, unknown>,
  method: string,
): Spy<Args, Return> {
  const original = obj[method]
  assertIsFunction(original)

  const calls: Args[] = []
  const results: Return[] = []

  const fn = function (this: unknown, ...args: Args): unknown {
    calls.push(args)
    const result = (original as (...x: Args) => Return).apply(this, args)
    results.push(result)
    return result
  } as Spy<Args, Return>

  fn.calls = calls
  fn.returns = results
  fn.restore = () => {
    obj[method] = original
  }

  obj[method] = fn
  return fn
}

/** Wraps a function so its calls can be observed without replacing anything. */
function spyOnFunction<Args extends unknown[], Result>(
  func: (...args: Args) => Result,
): ((...args: Args) => Result) & { calls: unknown[][]; returns: unknown[] } {
  const calls: unknown[][] = []
  const returns: unknown[] = []

  const fn = (...args: Args) => {
    calls.push(args)
    const result = func(...args)
    returns.push(result)
    return result
  }

  return Object.assign(fn, { calls, returns })
}

/** Spies on the callback functions passed to a method. */
export function spyOnCallbacks(
  obj: Record<string, (...args: unknown[]) => unknown>,
  method: string,
): { (...args: unknown[]): unknown; callbackSpies: unknown[][]; restore: () => void } {
  const original = obj[method]
  const callbackSpies: unknown[][] = []

  const fn = (...maybeCallbacks: unknown[]) => {
    const spies: unknown[] = []
    callbackSpies.push(spies)
    maybeCallbacks.forEach((target) => {
      if (typeof target === 'function') {
        spies.push(spyOnFunction(target as AnyFunction))
      } else {
        spies.push(target)
      }
    })
    return original(...spies)
  }

  fn.callbackSpies = callbackSpies
  fn.restore = () => {
    obj[method] = original
  }

  obj[method] = fn
  return fn
}

// ---------------------------------------------------------------------------
// String utilities
// ---------------------------------------------------------------------------

export function removeHtmlComments(str: string): string {
  return str.replace(/<!--[\s\S]*?(-->|$)/g, '')
}

export function removeCssComments(str: string): string {
  return str.replace(/\/\*[\s\S]+?\*\//g, '')
}

/** Best-effort JS comment stripper (keeps URLs in strings intact). */
export function removeJSComments(code: string): string {
  let out = ''
  let i = 0
  while (i < code.length) {
    const ch = code[i]
    const next = code[i + 1]
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch
      out += ch
      i += 1
      while (i < code.length) {
        out += code[i]
        if (code[i] === '\\') {
          i += 1
          if (i < code.length) out += code[i]
        } else if (code[i] === quote) {
          break
        }
        i += 1
      }
      i += 1
    } else if (ch === '/' && next === '/') {
      while (i < code.length && code[i] !== '\n') i += 1
    } else if (ch === '/' && next === '*') {
      const end = code.indexOf('*/', i + 2)
      i = end === -1 ? code.length : end + 2
    } else {
      out += ch
      i += 1
    }
  }
  return out
}

export function removeWhiteSpace(str: string): string {
  return str.replace(/\s/g, '')
}

export function escapeRegExp(exp: string): string {
  return exp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Checks if a function/method is called with no arguments. */
export function isCalledWithNoArgs(calledFuncName: string, callingCode: string): boolean {
  const noCommentsCallingCode = removeJSComments(callingCode)
  const funcExp = '^\\s*?' + escapeRegExp(calledFuncName) + '\\(\\s*?\\)'
  const matches = new RegExp(funcExp, 'gm').exec(noCommentsCallingCode) ?? []
  return Boolean(matches.length)
}

export function concatRegex(...regexes: (string | RegExp)[]): RegExp {
  const source = regexes.map((r) => new RegExp(r).source).join('')
  return new RegExp(source)
}

/** Generates a regex matching function expressions and declarations. */
export function functionRegex(
  funcName: string | null,
  paramList?: string[] | null,
  options?: { capture?: boolean; includeBody?: boolean },
): RegExp {
  const capture = options?.capture ?? false
  const includeBody = options?.includeBody ?? true
  const params = paramList ? paramList.join('\\s*,\\s*') : '[^)]*'

  const normalFunctionName = funcName ? '\\s' + escapeRegExp(funcName) : ''
  const arrowFunctionName = funcName
    ? '(let|const|var)?\\s?' + escapeRegExp(funcName) + '\\s*=\\s*'
    : ''
  const body = '[^}]*'

  const funcREHead = 'function\\s*' + normalFunctionName + '\\s*\\(\\s*' + params + '\\s*\\)\\s*\\{'
  const funcREBody = body + '\\}'
  const funcRegEx = includeBody ? funcREHead + funcREBody : funcREHead

  const arrowFuncREHead = arrowFunctionName + '\\(?\\s*' + params + '\\s*\\)?\\s*=>\\s*\\{?'
  const arrowFuncREBody = body + '\\}?'
  const arrowFuncRegEx = includeBody ? arrowFuncREHead + arrowFuncREBody : arrowFuncREHead

  const anonymousFunctionName = funcName
    ? '(let|const|var)?\\s?' + escapeRegExp(funcName) + '\\s*=\\s*function\\s*'
    : ''
  const anonymousFuncREHead = anonymousFunctionName + '\\(\\s*' + params + '\\s*\\)\\s*\\{'
  const anonymousFuncRegEx = includeBody ? anonymousFuncREHead + funcREBody : anonymousFuncREHead

  return new RegExp(
    '(' +
      (capture ? '' : '?:') +
      funcRegEx +
      '|' +
      arrowFuncRegEx +
      '|' +
      anonymousFuncRegEx +
      ')',
  )
}

function permutationsOf(items: (string | RegExp)[]): (string | RegExp)[][] {
  const permutations: (string | RegExp)[][] = []

  // Heap's algorithm
  function permute(array: (string | RegExp)[], length: number) {
    if (length === 1) {
      permutations.push(array.slice())
      return
    }
    for (let i = 0; i < length; i += 1) {
      permute(array, length - 1)
      if (length % 2 === 1) {
        const first = array[0]
        array[0] = array[length - 1]
        array[length - 1] = first
      } else {
        const current = array[i]
        array[i] = array[length - 1]
        array[length - 1] = current
      }
    }
  }

  permute(items, items.length)
  return permutations
}

/** Creates a regex matching the given regexes/source strings in any order. */
export function permutateRegex(
  regexes: (string | RegExp)[],
  {
    capture = false,
    elementsSeparator = '\\s*\\|\\|\\s*',
    permutationsSeparator = '|',
  }: {
    capture?: boolean
    elementsSeparator?: string
    permutationsSeparator?: string
  } = {},
): RegExp {
  const permutations = permutationsOf(regexes.map((r) => new RegExp(r).source))
  const source = permutations
    .map((permutation, index) =>
      permutation
        .join(elementsSeparator)
        .replace(/\(\?<([\w\d]+)>/g, '(?<$1_' + index + '>')
        .replace(/\\k<([\w\d]+)>/g, '\\k<$1_' + index + '>'),
    )
    .join(permutationsSeparator)

  return new RegExp('(' + (capture ? '' : '?:') + source + ')')
}

// ---------------------------------------------------------------------------
// CSS inspection (same CSSOM mechanism freeCodeCamp uses in the browser)
// ---------------------------------------------------------------------------

export interface ExtendedStyleDeclaration extends CSSStyleDeclaration {
  getPropVal: (prop: string, strip?: boolean) => string
}

export type ExtendedStyleRule = CSSStyleRule & {
  isDeclaredAfter: (selector: string) => boolean
}

function getIsDeclaredAfter(styleRule: CSSStyleRule) {
  return (selector: string) => {
    const sheet = styleRule.parentStyleSheet
    const cssStyleRules = Array.from(sheet?.cssRules ?? []).filter(
      (rule) => rule.type === CSSRule.STYLE_RULE,
    ) as CSSStyleRule[]
    const previousStyleRule = cssStyleRules.find((rule) => rule.selectorText === selector)
    if (!previousStyleRule) return false
    const currentPosition = Array.from(sheet?.cssRules ?? []).indexOf(styleRule)
    const previousPosition = Array.from(
      previousStyleRule.parentStyleSheet?.cssRules ?? [],
    ).indexOf(previousStyleRule)
    return currentPosition > previousPosition
  }
}

/** Legacy helper tests use to inspect the learner's CSS rules. */
export class CSSHelp {
  doc: Document

  constructor(doc: Document) {
    this.doc = doc
  }

  private getStyleRules(): CSSStyleRule[] {
    return this.styleSheetToCssRulesArray(this.getStyleSheet()).filter(
      (rule) => rule.type === CSSRule.STYLE_RULE,
    ) as CSSStyleRule[]
  }

  getStyleDeclarations(selector: string): CSSStyleDeclaration[] {
    return this.getStyleRules()
      .filter((rule) => rule.selectorText === selector)
      .map((rule) => rule.style)
  }

  getStyle(selector: string): ExtendedStyleDeclaration | null {
    const style = this.getStyleRules().find((rule) => rule.selectorText === selector)?.style
    if (!style) return null
    const extended = style as ExtendedStyleDeclaration
    extended.getPropVal = (prop: string, strip = false) =>
      strip ? style.getPropertyValue(prop).replace(/\s+/g, '') : style.getPropertyValue(prop)
    return extended
  }

  /** getStyle for tests where multiple selectors are acceptable. */
  getStyleAny(selectors: string[]): ExtendedStyleDeclaration | null {
    for (const selector of selectors) {
      const style = this.getStyle(selector)
      if (style) return style
    }
    return null
  }

  getStyleRule(selector: string): ExtendedStyleRule | null {
    const styleRule = this.getStyleRules().find((rule) => rule.selectorText === selector)
    if (!styleRule) return null
    return Object.assign(styleRule, {
      isDeclaredAfter: (other: string) => getIsDeclaredAfter(styleRule)(other),
    }) as ExtendedStyleRule
  }

  getCSSRules(element?: string): CSSRule[] {
    const cssRules = this.styleSheetToCssRulesArray(this.getStyleSheet())
    switch (element) {
      case 'media':
        return cssRules.filter((rule) => rule.type === CSSRule.MEDIA_RULE)
      case 'fontface':
        return cssRules.filter((rule) => rule.type === CSSRule.FONT_FACE_RULE)
      case 'import':
        return cssRules.filter((rule) => rule.type === CSSRule.IMPORT_RULE)
      case 'keyframes':
        return cssRules.filter((rule) => rule.type === CSSRule.KEYFRAMES_RULE)
      default:
        return cssRules
    }
  }

  isPropertyUsed(property: string): boolean {
    return this.getStyleRules().some((rule) => rule.style?.getPropertyValue(property))
  }

  getRuleListsWithinMedia(mediaText: string): CSSStyleRule[] {
    const medias = this.getCSSRules('media') as CSSMediaRule[]
    const match = medias.find((rule) => rule.media?.mediaText === mediaText)
    return Array.from(match?.cssRules ?? []) as CSSStyleRule[]
  }

  getStyleSheet(): CSSStyleSheet | null {
    const link = this.doc?.querySelector<HTMLLinkElement>("link[href*='styles']")
    // CodeKwes injects the merged styles.css fence with this class, mirroring
    // FCC's 'fcc-injected-styles' convention.
    const stylesDotCss = this.doc?.querySelector<HTMLStyleElement>('style.fcc-injected-styles')
    // Steps that put CSS in plain <style> tags.
    const styleTag = this.doc?.querySelector<HTMLStyleElement>('style:not([class]):not([media])')

    if (link?.sheet?.cssRules?.length) return link.sheet
    if (stylesDotCss) return stylesDotCss.sheet
    if (styleTag) return styleTag.sheet
    return null
  }

  styleSheetToCssRulesArray(styleSheet: CSSStyleSheet | null): CSSRule[] {
    return Array.from(styleSheet?.cssRules ?? [])
  }

  /** All equivalent selectors for a selector, based on the current document. */
  selectorsFromSelector(selector: string): string[] {
    const elements = Array.from(this.doc.querySelectorAll(selector))
    const allSelectors = elements
      .map((element) => {
        const directPath: string[] = []
        const indirectPath: string[] = []
        const allPaths: string[] = []
        let node: Element | null = element

        while (node?.parentNode) {
          let tag = node.tagName.toLowerCase()
          const siblings = Array.from(node.parentNode.children ?? [])
          if (siblings.filter((entry) => entry.tagName === node?.tagName).length > 1) {
            const allSiblings = Array.from(node.parentNode.childNodes)
            const index = allSiblings.indexOf(node)
            tag += ':nth-child(' + (index + 1) + ')'
          }
          directPath.unshift(tag)
          indirectPath.unshift(tag)
          allPaths.push(directPath.join(' > '), indirectPath.join(' '))
          node = node.parentNode as Element | null
        }

        return allPaths
      })
      .flat()

    return [...new Set(allSelectors)]
  }
}

// ---------------------------------------------------------------------------
// Function inspection
// ---------------------------------------------------------------------------

/** Extracts all function parameter names and default values from code. */
export function getFunctionParams(code: string): { name: string; defaultValue?: string }[] {
  const functionDeclareRegex = /(?:function\s*[^(]*\(([^)]*)\))/
  const functionVariableRegex = /(?:\b(?:const|let|var)\s*\w+\s*=\s*(?:function)?\s*\(([^)]*)\))/
  const arrowFunctionRegex = /=\s+([^)]*)=>/

  const paramMatch =
    code.match(functionDeclareRegex) ??
    code.match(functionVariableRegex) ??
    code.match(arrowFunctionRegex)

  if (paramMatch?.[1]?.trim()) {
    return paramMatch[1]
      .replace(/[{}[\]]/g, '')
      .split(',')
      .map((param) => {
        const parts = param.trim().split(/[=]/)
        return {
          name: parts[0].trim(),
          defaultValue: parts.length > 1 ? parts[1].replace(/['"]/g, '').trim() : undefined,
        }
      })
  }

  return []
}

/** Regex matching a `.method(callback)` pattern assigned to a target variable. */
export function callbackCallRegex(options: {
  target: string
  source: string
  method: string
  params: string[]
  returns?: RegExp
}): RegExp {
  const { target, source, method, params, returns } = options
  const identifierChar = '[\\w$]'

  const targetPart =
    '(?:(?:const|let|var)\\s+)?(?<!' +
    identifierChar +
    ')' +
    escapeRegExp(target) +
    '(?!' +
    identifierChar +
    ')\\s*=\\s*'
  const methodPart =
    '(?<!' +
    identifierChar +
    ')' +
    escapeRegExp(source) +
    '(?!' +
    identifierChar +
    ')\\.' +
    escapeRegExp(method) +
    '\\(\\s*'
  const callbackSignature = functionRegex(null, params, { includeBody: false })

  if (returns !== undefined) {
    const bodyPart = '\\s*(?:return\\s+)?(?:' + returns.source + ')\\s*[;]?\\s*\\}?'
    const returnsFlags = returns.flags.replace(/[gy]/g, '')
    const combined = concatRegex(targetPart, methodPart, callbackSignature, bodyPart)
    return new RegExp(combined.source, returnsFlags)
  }

  return concatRegex(targetPart, methodPart, callbackSignature)
}

/** Retries a check a number of times — handy for DOM timing quirks. */
export function retryingTest(test: () => unknown, message: string, tries = 20): Promise<void> {
  if (tries < 1) return Promise.reject(new Error(message))
  if (test()) return Promise.resolve()

  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      retryingTest(test, message, tries - 1)
        .then(resolve)
        .catch(reject)
    }, 1)
  })
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export interface LessonHelpers {
  RandomMocker: typeof RandomMocker
  CSSHelp: typeof CSSHelp
  Explorer: (code: string) => Promise<LessonExplorer>
  spyOn: typeof spyOn
  spyOnCallbacks: typeof spyOnCallbacks
  removeHtmlComments: typeof removeHtmlComments
  removeCssComments: typeof removeCssComments
  removeJSComments: typeof removeJSComments
  removeWhiteSpace: typeof removeWhiteSpace
  escapeRegExp: typeof escapeRegExp
  isCalledWithNoArgs: typeof isCalledWithNoArgs
  concatRegex: typeof concatRegex
  functionRegex: typeof functionRegex
  permutateRegex: typeof permutateRegex
  getFunctionParams: typeof getFunctionParams
  callbackCallRegex: typeof callbackCallRegex
  retryingTest: typeof retryingTest
}

export function createLessonHelpers(): LessonHelpers {
  return {
    RandomMocker,
    CSSHelp,
    Explorer: openExplorer,
    spyOn,
    spyOnCallbacks,
    removeHtmlComments,
    removeCssComments,
    removeJSComments,
    removeWhiteSpace,
    escapeRegExp,
    isCalledWithNoArgs,
    concatRegex,
    functionRegex,
    permutateRegex,
    getFunctionParams,
    callbackCallRegex,
    retryingTest,
  }
}
