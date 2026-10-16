import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { loadLocalProgress, saveLocalProgress } from '../lib/storage'

interface ProgressContextValue {
  /** Set of completed ids in `certSlug/blockSlug` form. */
  completed: Set<string>
  /** Where progress is currently stored. */
  mode: 'cloud' | 'local'
  loading: boolean
  isDone: (id: string) => boolean
  toggle: (id: string) => Promise<void>
  countForCert: (certSlug: string) => number
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [completed, setCompleted] = useState<Set<string>>(() => new Set())
  const [loading, setLoading] = useState(true)

  const cloud = Boolean(supabase && user)

  useEffect(() => {
    let active = true
    setLoading(true)

    if (supabase && user) {
      const currentUser = user
      const client = supabase
      const localIds = loadLocalProgress()

      const run = async () => {
        const { data, error } = await client
          .from('progress')
          .select('cert_slug, block_slug')

        if (!active) return

        if (error) {
          // Fall back to local progress if the cloud read fails.
          setCompleted(new Set(localIds))
          setLoading(false)
          return
        }

        const rows = (data ?? []) as { cert_slug: string; block_slug: string }[]
        const cloudIds = rows.map((r) => `${r.cert_slug}/${r.block_slug}`)
        const merged = new Set<string>([...cloudIds, ...localIds])

        // Push locally-completed items to the cloud, then clear the local copy.
        const toSync = localIds.filter((id) => !cloudIds.includes(id))
        if (toSync.length > 0) {
          const inserts = toSync
            .map((id) => {
              const [cert_slug, block_slug] = id.split('/')
              if (!cert_slug || !block_slug) return null
              return { user_id: currentUser.id, cert_slug, block_slug }
            })
            .filter((row): row is { user_id: string; cert_slug: string; block_slug: string } => row !== null)

          if (inserts.length > 0) {
            const { error: upsertError } = await client
              .from('progress')
              .upsert(inserts, { onConflict: 'user_id,cert_slug,block_slug', ignoreDuplicates: true })
            if (!upsertError) saveLocalProgress([])
          }
        }

        if (!active) return
        setCompleted(merged)
        setLoading(false)
      }

      run()
    } else {
      setCompleted(new Set(loadLocalProgress()))
      setLoading(false)
    }

    return () => {
      active = false
    }
  }, [user?.id, cloud])

  const value = useMemo<ProgressContextValue>(() => {
    const toggle = async (id: string) => {
      const wasDone = completed.has(id)
      const next = new Set(completed)
      if (wasDone) next.delete(id)
      else next.add(id)
      setCompleted(next)

      const [certSlug, blockSlug] = id.split('/')
      if (!certSlug || !blockSlug) return

      if (supabase && user) {
        if (wasDone) {
          const { error } = await supabase
            .from('progress')
            .delete()
            .eq('user_id', user.id)
            .eq('cert_slug', certSlug)
            .eq('block_slug', blockSlug)
          if (error) {
            console.error('Failed to remove progress:', error.message)
            setCompleted(completed) // revert optimistic update
          }
        } else {
          const { error } = await supabase
            .from('progress')
            .upsert(
              { user_id: user.id, cert_slug: certSlug, block_slug: blockSlug },
              { onConflict: 'user_id,cert_slug,block_slug' },
            )
          if (error) {
            console.error('Failed to save progress:', error.message)
            setCompleted(completed) // revert optimistic update
          }
        }
      } else {
        saveLocalProgress([...next])
      }
    }

    return {
      completed,
      mode: supabase && user ? 'cloud' : 'local',
      loading,
      isDone: (id: string) => completed.has(id),
      toggle,
      countForCert: (certSlug: string) => {
        let count = 0
        for (const id of completed) {
          if (id.startsWith(`${certSlug}/`)) count += 1
        }
        return count
      },
    }
  }, [completed, loading, user])

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>')
  return ctx
}
