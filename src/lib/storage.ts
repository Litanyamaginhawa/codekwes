import type { Snippet } from '../types'

/**
 * localStorage fallbacks used when Supabase is not configured or the visitor
 * is not signed in. Progress ids use the `certSlug/blockSlug` format.
 */

const PROGRESS_KEY = 'codekwes.progress.v1'
const SNIPPETS_KEY = 'codekwes.snippets.v1'

export function loadLocalProgress(): string[] {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string')
  } catch {
    return []
  }
}

export function saveLocalProgress(ids: string[]): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(ids))
  } catch {
    // Storage can fail in private browsing modes — progress is simply not persisted.
  }
}

export function loadLocalSnippets(): Snippet[] {
  try {
    const raw = localStorage.getItem(SNIPPETS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (s): s is Snippet =>
          typeof s === 'object' &&
          s !== null &&
          typeof (s as Snippet).id === 'string' &&
          typeof (s as Snippet).title === 'string' &&
          typeof (s as Snippet).html === 'string' &&
          typeof (s as Snippet).css === 'string' &&
          typeof (s as Snippet).js === 'string',
      )
      .map((s) => ({
        id: s.id,
        title: s.title,
        html: s.html,
        css: s.css,
        js: s.js,
        updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : new Date().toISOString(),
      }))
  } catch {
    return []
  }
}

export function saveLocalSnippets(snippets: Snippet[]): void {
  try {
    localStorage.setItem(SNIPPETS_KEY, JSON.stringify(snippets))
  } catch {
    // Ignore quota / private-browsing errors.
  }
}

export function uid(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    // fall through to the manual id below
  }
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}
