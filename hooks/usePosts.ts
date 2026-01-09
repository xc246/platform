import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Post } from '@/types'

export function usePosts(type?: 'lost' | 'found') {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:profiles(id, nickname, avatar_url)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      if (type) {
        query = query.eq('type', type)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setPosts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts')
      console.error('Error fetching posts:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [type])

  const refreshPosts = () => fetchPosts()

  return { posts, loading, error, refreshPosts }
}
