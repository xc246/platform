import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Comment } from '@/types'

export function useComments(postId: number) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchComments = async () => {
    if (!postId) {
      setComments([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:profiles(id, nickname, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError

      setComments(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments')
      console.error('Error fetching comments:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()

    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          fetchComments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId])

  const refreshComments = () => fetchComments()

  return { comments, loading, error, refreshComments }
}
