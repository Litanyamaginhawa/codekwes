/**
 * Markdown rendering for freeCodeCamp curriculum content (trusted, fetched
 * from the open-source repository at build time).
 */
import { marked } from 'marked'

marked.setOptions({ gfm: true, breaks: false })

/** Render the trusted upstream markdown to HTML. */
export function renderMarkdown(markdown: string): string {
  const cleaned = cleanContainerMarkers(markdown)
  return marked.parse(cleaned, { async: false })
}

/** Inline variant without wrapping paragraphs, for one-liners. */
export function renderInlineMarkdown(markdown: string): string {
  const cleaned = cleanContainerMarkers(markdown)
  return marked.parseInline(cleaned, { async: false })
}

/** Strip stray `:::` container markers that upstream occasionally uses. */
function cleanContainerMarkers(markdown: string): string {
  return markdown
    .split('\n')
    .filter((line) => !/^\s*:::\s*[\w-]*\s*$/.test(line))
    .join('\n')
}

export interface ContentSegment {
  type: 'markdown' | 'code'
  markdown?: string
  lang?: string
  code?: string
}

/**
 * Lectures and reviews embed runnable editors as
 * `:::interactive_editor` fenced blocks. Split the content so those become
 * mini editors and everything else renders as markdown.
 */
export function splitInteractive(content: string): ContentSegment[] {
  const segments: ContentSegment[] = []
  const regex = /:::interactive_editor\s*\n([\s\S]*?)\n:::/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(content)) !== null) {
    const before = content.slice(last, match.index).trim()
    if (before) segments.push({ type: 'markdown', markdown: before })
    const fence = match[1].match(/```(\w+)\s*\n([\s\S]*?)```/)
    if (fence) {
      segments.push({ type: 'code', lang: fence[1], code: fence[2].replace(/\s+$/, '') })
    }
    last = regex.lastIndex
  }
  const rest = content.slice(last).trim()
  if (rest) segments.push({ type: 'markdown', markdown: rest })
  return segments
}
