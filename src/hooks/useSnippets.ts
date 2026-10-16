import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { loadLocalSnippets, saveLocalSnippets, uid } from '../lib/storage'
import type { Snippet, SnippetRow } from '../types'

interface SaveSnippetInput {
  /** Provide an id to update an existing snippet. */
  id?: string
  title: string
  html: string
  css: string
  js: string
}

interface UseSnippetsResult {
  snippets: Snippet[]
  loading: boolean
  /** True when snippets are stored in the cloud (Supabase + signed in). */
  cloud: boolean
  saveSnippet: (input: SaveSnippetInput) => Promise<Snippet | null>
  deleteSnippet: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useSnippets(): UseSnippetsResult {
  const { user } = useAuth()
  const cloud = Boolean(supabase && user)
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (supabase && user) {
      setLoading(true)
      const { data, error } = await supabase
        .from('snippets')
        .select('id, user_id, title, html, css, js, updated_at')
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Failed to load snippets:', error.message)
        setSnippets([])
      } else {
        setSnippets(
          ((data ?? []) as SnippetRow[]).map((row) => ({
            id: row.id,
            title: row.title,
            html: row.html,
            css: row.css,
            js: row.js,
            updatedAt: row.updated_at,
          })),
        )
      }
      setLoading(false)
    } else {
      setSnippets(loadLocalSnippets().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)))
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    refresh()
  }, [refresh])

  const saveSnippet = useCallback(
    async (input: SaveSnippetInput): Promise<Snippet | null> => {
      const now = new Date().toISOString()
      const title = input.title.trim() || 'Untitled snippet'

      if (supabase && user) {
        const row: Record<string, string> = {
          user_id: user.id,
          title,
          html: input.html,
          css: input.css,
          js: input.js,
          updated_at: now,
        }
        if (input.id) row.id = input.id

        const { data, error } = await supabase
          .from('snippets')
          .upsert(row, input.id ? { onConflict: 'id' } : undefined)
          .select('id, user_id, title, html, css, js, updated_at')
          .single()

        if (error) {
          console.error('Failed to save snippet:', error.message)
          return null
        }
        const saved = data as SnippetRow
        const snippet: Snippet = {
          id: saved.id,
          title: saved.title,
          html: saved.html,
          css: saved.css,
          js: saved.js,
          updatedAt: saved.updated_at,
        }
        setSnippets((prev) => [snippet, ...prev.filter((s) => s.id !== snippet.id)])
        return snippet
      }

      // Local mode
      const snippet: Snippet = {
        id: input.id ?? uid(),
        title,
        html: input.html,
        css: input.css,
        js: input.js,
        updatedAt: now,
      }
      const next = [snippet, ...loadLocalSnippets().filter((s) => s.id !== snippet.id)]
      saveLocalSnippets(next)
      setSnippets(next)
      return snippet
    },
    [user?.id],
  )

  const deleteSnippet = useCallback(
    async (id: string) => {
      if (supabase && user) {
        const { error } = await supabase.from('snippets').delete().eq('id', id)
        if (error) {
          console.error('Failed to delete snippet:', error.message)
          return
        }
        setSnippets((prev) => prev.filter((s) => s.id !== id))
      } else {
        const next = loadLocalSnippets().filter((s) => s.id !== id)
        saveLocalSnippets(next)
        setSnippets(next)
      }
    },
    [user?.id],
  )

  return { snippets, loading, cloud, saveSnippet, deleteSnippet, refresh }
}
