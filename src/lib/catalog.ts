/**
 * Builds a flat, filterable practice catalog from the freeCodeCamp
 * open-source curriculum structure files in `src/data/fcc/`.
 *
 * Each block in the curriculum becomes one catalog item whose URL points at
 * the official freeCodeCamp lesson, workshop, lab, quiz or exam page, e.g.
 *   https://www.freecodecamp.org/learn/javascript-v9/workshop-calculator
 */

import rwdJson from '../data/fcc/responsive-web-design-v9.json'
import jsJson from '../data/fcc/javascript-v9.json'
import felJson from '../data/fcc/front-end-development-libraries-v9.json'
import pyJson from '../data/fcc/python-v9.json'
import rdbJson from '../data/fcc/relational-databases-v9.json'
import beJson from '../data/fcc/back-end-development-and-apis-v9.json'
import fsJson from '../data/fcc/full-stack-developer-v9.json'
import { CERT_META, CERT_META_BY_SLUG, type CertMeta } from '../data/certifications'

// ---------------------------------------------------------------------------
// Raw curriculum shapes (mirrors freeCodeCamp's superblock JSON files)
// ---------------------------------------------------------------------------

export interface RawModule {
  dashedName: string
  moduleType?: string
  comingSoon?: boolean
  blocks: string[]
}

export interface RawChapter {
  dashedName: string
  chapterType?: string
  comingSoon?: boolean
  modules: RawModule[]
}

export interface RawSuperblock {
  chapters: RawChapter[]
}

// ---------------------------------------------------------------------------
// Catalog types
// ---------------------------------------------------------------------------

export type BlockType = 'lesson' | 'workshop' | 'lab' | 'review' | 'quiz' | 'exam' | 'project'

export interface CatalogItem {
  /** `certSlug/blockSlug` — unique across the whole catalog */
  id: string
  certSlug: string
  chapterSlug: string
  moduleSlug: string
  blockSlug: string
  /** Human-readable title derived from the block slug */
  title: string
  type: BlockType
  /** True when the block is one of the required certification projects */
  isCertProject: boolean
  comingSoon: boolean
  /** Official freeCodeCamp page for this block */
  url: string
  /** Position in the curriculum (curriculum order) */
  order: number
}

export const FCC_LEARN_BASE = 'https://www.freecodecamp.org/learn'

export const TYPE_LABEL: Record<BlockType, string> = {
  lesson: 'Lesson',
  workshop: 'Workshop',
  lab: 'Lab',
  review: 'Review',
  quiz: 'Quiz',
  exam: 'Exam',
  project: 'Certification Project',
}

export const TYPE_COLOR: Record<BlockType, string> = {
  lesson: '#38bdf8',
  workshop: '#fbbf24',
  lab: '#34d399',
  review: '#a78bfa',
  quiz: '#fb7185',
  exam: '#f87171',
  project: '#facc15',
}

export const TYPE_DESCRIPTION: Record<BlockType, string> = {
  lesson:
    'Lessons introduce new concepts with interactive code examples you can run and edit. Read through the material, experiment with the snippets, and answer the comprehension checks at the end.',
  workshop:
    'Workshops are guided, step-by-step projects. You build a real working project one small step at a time while freeCodeCamp checks each step as you go.',
  lab: 'Labs give you a set of user stories and a test suite — then it is your turn to build the project from scratch and pass every test.',
  review:
    'A review page collecting everything you just covered. Skim it to refresh the concepts before taking the module quiz, or use it as a cheat sheet later.',
  quiz: 'A multiple-choice quiz at the end of the module. You need 18 out of 20 correct to pass, so review the lessons first.',
  exam: 'The certification exam. Once you have completed all required projects, take the proctored exam through freeCodeCamp\u2019s open-source exam environment to earn your verified certification.',
  project:
    'A required certification project. Complete build-from-scratch projects like this one to qualify for the free verified certification exam.',
}

// ---------------------------------------------------------------------------
// Title prettifier — turns `workshop-cat-photo-app` into `Cat Photo App`
// ---------------------------------------------------------------------------

const BLOCK_PREFIX = /^(lecture|workshop|lab|review|quiz|exam)-/

const WORD_FIXES: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  nodejs: 'Node.js',
  npm: 'npm',
  html: 'HTML',
  css: 'CSS',
  api: 'API',
  apis: 'APIs',
  sql: 'SQL',
  http: 'HTTP',
  https: 'HTTPS',
  dns: 'DNS',
  tcpip: 'TCP/IP',
  tcp: 'TCP',
  rest: 'REST',
  git: 'Git',
  github: 'GitHub',
  d3: 'D3',
  seo: 'SEO',
  oop: 'OOP',
  jwt: 'JWT',
  svg: 'SVG',
  svgs: 'SVGs',
  iframe: 'iframe',
  localstorage: 'localStorage',
  regex: 'RegEx',
  regexp: 'RegExp',
  cli: 'CLI',
  ide: 'IDE',
  ides: 'IDEs',
  ui: 'UI',
  ux: 'UX',
  rpg: 'RPG',
  json: 'JSON',
  url: 'URL',
  urls: 'URLs',
  dom: 'DOM',
  ajax: 'AJAX',
  crud: 'CRUD',
  mcp: 'MCP',
  rag: 'RAG',
  ai: 'AI',
  cta: 'CTA',
  isbn: 'ISBN',
  rsvp: 'RSVP',
  nth: 'Nth',
}

const MINOR_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'of', 'on', 'or', 'the', 'to', 'with', 'vs',
])

/** `workshop-build-a-random-joke-app` -> `Build a Random Joke App` */
export function prettyTitle(blockSlug: string): string {
  const base = blockSlug.replace(BLOCK_PREFIX, '')
  return base
    .split('-')
    .map((word, index) => {
      if (word in WORD_FIXES) return WORD_FIXES[word]
      if (index > 0 && MINOR_WORDS.has(word)) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/** `react-state-hooks-and-routing` -> `React State Hooks and Routing` */
export function prettySlug(dashedName: string): string {
  return prettyTitle(dashedName)
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

function blockType(slug: string): Exclude<BlockType, 'project'> {
  if (slug.startsWith('lecture-')) return 'lesson'
  if (slug.startsWith('workshop-')) return 'workshop'
  if (slug.startsWith('lab-')) return 'lab'
  if (slug.startsWith('review-')) return 'review'
  if (slug.startsWith('quiz-')) return 'quiz'
  if (slug.startsWith('exam-')) return 'exam'
  return 'lesson'
}

const SUPERBLOCKS: { slug: string; data: RawSuperblock }[] = [
  { slug: 'responsive-web-design-v9', data: rwdJson as unknown as RawSuperblock },
  { slug: 'javascript-v9', data: jsJson as unknown as RawSuperblock },
  { slug: 'front-end-development-libraries-v9', data: felJson as unknown as RawSuperblock },
  { slug: 'python-v9', data: pyJson as unknown as RawSuperblock },
  { slug: 'relational-databases-v9', data: rdbJson as unknown as RawSuperblock },
  { slug: 'back-end-development-and-apis-v9', data: beJson as unknown as RawSuperblock },
  { slug: 'full-stack-developer-v9', data: fsJson as unknown as RawSuperblock },
]

function buildCatalog(): CatalogItem[] {
  const items: CatalogItem[] = []
  for (const { slug, data } of SUPERBLOCKS) {
    for (const chapter of data.chapters) {
      for (const mod of chapter.modules) {
        const isCertProject = mod.moduleType === 'cert-project'
        for (const block of mod.blocks) {
          items.push({
            id: `${slug}/${block}`,
            certSlug: slug,
            chapterSlug: chapter.dashedName,
            moduleSlug: mod.dashedName,
            blockSlug: block,
            title: prettyTitle(block),
            type: isCertProject ? 'project' : blockType(block),
            isCertProject,
            comingSoon: Boolean(mod.comingSoon || chapter.comingSoon),
            url: `${FCC_LEARN_BASE}/${slug}/${block}`,
            order: items.length,
          })
        }
      }
    }
  }
  return items
}

export const catalog: CatalogItem[] = buildCatalog()

export const ITEM_BY_ID: Map<string, CatalogItem> = new Map(catalog.map((item) => [item.id, item]))

export function getItem(certSlug: string, blockSlug: string): CatalogItem | undefined {
  return ITEM_BY_ID.get(`${certSlug}/${blockSlug}`)
}

export function itemsByCert(certSlug: string): CatalogItem[] {
  return catalog.filter((item) => item.certSlug === certSlug)
}

export function countByCert(certSlug: string): number {
  return itemsByCert(certSlug).length
}

/** Distinct module slugs for a cert, in curriculum order. */
export function modulesByCert(certSlug: string): { moduleSlug: string; label: string; count: number }[] {
  const seen = new Map<string, { moduleSlug: string; label: string; count: number }>()
  for (const item of catalog) {
    if (item.certSlug !== certSlug) continue
    const existing = seen.get(item.moduleSlug)
    if (existing) {
      existing.count += 1
    } else {
      seen.set(item.moduleSlug, { moduleSlug: item.moduleSlug, label: prettySlug(item.moduleSlug), count: 1 })
    }
  }
  return [...seen.values()]
}

export function getCertMeta(slug: string): CertMeta | undefined {
  return CERT_META_BY_SLUG[slug]
}

const HANDS_ON_TYPES: BlockType[] = ['workshop', 'lab', 'project']
export const handsOnCount = catalog.filter((item) => HANDS_ON_TYPES.includes(item.type)).length

export const certMetaList: CertMeta[] = CERT_META
