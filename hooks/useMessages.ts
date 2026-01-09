import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export interface Message {
  id: number
  post_id: number
  user_id: string
  content: string
  is_read: boolean
  created_at: string
}

export function useMessages(user: User | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchMessages = async () => {
    if (!user) {
      setMessages([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setMessages(data || [])
      setUnreadCount(data?.filter((m: Message) => !m.is_read).length || 0)
    } catch (err) {
      console.error('Error fetching messages:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return

    fetchMessages()

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const markAsRead = async (messageId: number) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', messageId)

      fetchMessages()
    } catch (err) {
      console.error('Error marking message as read:', err)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      fetchMessages()
    } catch (err) {
      console.error('Error marking all messages as read:', err)
    }
  }

  return { messages, unreadCount, loading, markAsRead, markAllAsRead }
}
