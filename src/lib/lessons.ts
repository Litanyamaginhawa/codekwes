/**
 * Loading and local persistence for the in-site freeCodeCamp lessons.
 *
 * Lesson JSON files live in `public/lessons/` and are generated from
 * freeCodeCamp's open-source curriculum by `.tools/fetch-lessons.cjs`.
 * Loaders cache their results for the lifetime of the session.
 */

export interface LessonHint {
  text: string
  test: string
}

export interface LessonChallenge {
  kind: 'challenge'
  id: string
  title: string
  challengeType: number
  demoType: string | null
  description: string
  hints: LessonHint[]
  seed: string
  seedLang: string
  region: [number, number] | null
  /** FCC `# --solutions--` code, used to validate tests and as a reference. */
  solution?: string | null
  solutionLang?: string | null
  /** Optional FCC `--before-all--` hook, run once before the code. */
  beforeAll?: string
  /** Optional FCC `--before-each--` hook, run before each test. */
  beforeEach?: string
}

export interface LessonArticle {
  kind: 'article'
  id: string
  title: string
  content: string
}

export interface LessonQuizQuestion {
  text: string
  distractors: string[]
  answer: string
}

export interface LessonQuiz {
  kind: 'quiz'
  id: string
  title: string
  questions: LessonQuizQuestion[]
  passScore: number
}

export type LessonItem = LessonChallenge | LessonArticle | LessonQuiz

export interface LessonBlock {
  slug: string
  kind: 'workshop' | 'lab' | 'lecture' | 'review' | 'quiz'
  title: string
  fetchedAt: string
  items: LessonItem[]
}

export interface LessonIndexEntry {
  kind: LessonBlock['kind']
  items: number
  title: string
}

export interface LessonIndex {
  generated: string
  blocks: Record<string, LessonIndexEntry>
}

let indexCache: LessonIndex | null = null

export async function loadLessonIndex(): Promise<LessonIndex> {
  if (indexCache) return indexCache
  try {
    const res = await fetch('/lessons/index.json', { cache: 'no-cache' })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    indexCache = (await res.json()) as LessonIndex
  } catch {
    indexCache = { generated: '', blocks: {} }
  }
  return indexCache
}

const blockCache = new Map<string, LessonBlock | null>()

export async function loadLessonBlock(slug: string): Promise<LessonBlock | null> {
  const cached = blockCache.get(slug)
  if (cached !== undefined) return cached
  try {
    const res = await fetch('/lessons/' + slug + '.json', { cache: 'no-cache' })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const data = (await res.json()) as LessonBlock
    blockCache.set(slug, data)
    return data
  } catch {
    blockCache.set(slug, null)
    return null
  }
}

// ---------------------------------------------------------------------------
// Local per-step progress and drafts
// ---------------------------------------------------------------------------

const LESSON_STATE_KEY = 'codekwes.lessons.v1'

export interface BlockLessonState {
  /** Indexes of completed items. */
  done: number[]
  /** Last visited item index. */
  last: number
  /** Saved editor content per item index (key is the index as a string). */
  drafts: Record<string, string>
}

function emptyState(): BlockLessonState {
  return { done: [], last: 0, drafts: {} }
}

type LessonStateMap = Record<string, BlockLessonState>

function loadAll(): LessonStateMap {
  try {
    const raw = localStorage.getItem(LESSON_STATE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    return parsed as LessonStateMap
  } catch {
    return {}
  }
}

function saveAll(map: LessonStateMap): void {
  try {
    localStorage.setItem(LESSON_STATE_KEY, JSON.stringify(map))
  } catch {
    // Private browsing — progress is simply not persisted.
  }
}

export function loadLessonState(slug: string): BlockLessonState {
  const stored = loadAll()[slug]
  if (!stored || typeof stored !== 'object') return emptyState()
  return {
    done: Array.isArray(stored.done) ? stored.done.filter((n) => typeof n === 'number') : [],
    last: typeof stored.last === 'number' ? stored.last : 0,
    drafts: stored.drafts && typeof stored.drafts === 'object' ? stored.drafts : {},
  }
}

export function saveLessonState(slug: string, state: BlockLessonState): void {
  const map = loadAll()
  map[slug] = state
  saveAll(map)
}
