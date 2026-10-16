/** A code snippet saved from the playground. */
export interface Snippet {
  id: string
  title: string
  html: string
  css: string
  js: string
  updatedAt: string
}

/** Row shape stored in the Supabase `progress` table. */
export interface ProgressRow {
  user_id: string
  cert_slug: string
  block_slug: string
}

/** Row shape stored in the Supabase `snippets` table. */
export interface SnippetRow {
  id: string
  user_id: string
  title: string
  html: string
  css: string
  js: string
  updated_at: string
}
