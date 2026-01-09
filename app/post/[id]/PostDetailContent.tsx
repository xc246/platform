'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { useComments } from '@/hooks/useComments'
import { supabase } from '@/lib/supabase'
import { ITEM_CATEGORIES_MAP } from '@/lib/constants'
import { MapPin, Calendar, User as UserIcon, ArrowLeft, Check } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Post {
  id: number
  type: 'lost' | 'found'
  user_id: string
  title: string
  description: string | null
  item_category: string | null
  location: string | null
  lost_found_date: string | null
  image_urls: string[] | null
  status: 'open' | 'closed'
  created_at: string
  profiles: {
    nickname: string | null
    avatar_url: string | null
  }
}

export function PostDetailContent({ postId }: { postId: number }) {
  const router = useRouter()
  const { user } = useAuth()
  const { comments, refreshComments } = useComments(postId)
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPost()
  }, [postId])

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:profiles(nickname, avatar_url)
        `)
        .eq('id', postId)
        .single()

      if (error) throw error
      setPost(data)
    } catch (err) {
      console.error('Error fetching post:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      alert('请先登录后评论')
      return
    }

    if (!comment.trim()) {
      return
    }

    setSubmitting(true)

    try {
      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: user.id,
        content: comment.trim(),
        is_anonymous: isAnonymous,
      })

      if (error) throw error

      setComment('')
      setIsAnonymous(false)
      refreshComments()
    } catch (err) {
      console.error('Error submitting comment:', err)
      alert('评论提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkAsFound = async () => {
    if (!user || !post) return

    try {
      const { error } = await supabase
        .from('posts')
        .update({ status: 'closed' })
        .eq('id', postId)
        .eq('user_id', user.id)

      if (error) throw error

      // 刷新帖子数据
      await fetchPost()
      alert('已标记为已找到')
    } catch (err) {
      console.error('Error updating post status:', err)
      alert('标记失败')
    }
  }

  const handleReopenPost = async () => {
    if (!user || !post) return

    try {
      const { error } = await supabase
        .from('posts')
        .update({ status: 'open' })
        .eq('id', postId)
        .eq('user_id', user.id)

      if (error) throw error

      // 刷新帖子数据
      await fetchPost()
      alert('已重新打开帖子')
    } catch (err) {
      console.error('Error updating post status:', err)
      alert('操作失败')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="pt-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="pt-16 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">帖子不存在</h2>
            <Link href="/">
              <Button>返回首页</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700">
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar>
                    {post.profiles?.avatar_url && (
                      <AvatarImage src={post.profiles.avatar_url} />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {post.profiles?.nickname?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{post.profiles?.nickname || '匿名用户'}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-2xl">{post.title}</CardTitle>
                  {post.status === 'closed' && (
                    <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                      <Check className="w-3 h-3 mr-1" />
                      已找到
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {post.location || '未知地点'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {post.lost_found_date
                        ? new Date(post.lost_found_date).toLocaleDateString('zh-CN')
                        : '未知时间'}
                    </span>
                  </div>
                </div>
              </div>
              {user && user.id === post.user_id && (
                <div>
                  {post.status === 'open' ? (
                    <Button
                      onClick={handleMarkAsFound}
                      className="gap-2"
                    >
                      <Check className="w-4 h-4" />
                      标记为已找到
                    </Button>
                  ) : (
                    <Button
                      onClick={handleReopenPost}
                      variant="outline"
                      className="gap-2"
                    >
                      重新打开
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {post.item_category && (
              <Badge variant="secondary" className="mb-4">
                {ITEM_CATEGORIES_MAP[post.item_category as keyof typeof ITEM_CATEGORIES_MAP] || post.item_category}
              </Badge>
            )}

            {post.description ? (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {post.description}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 italic">暂无详细描述</p>
            )}

            <Separator className="my-6" />

            <div className="text-sm text-muted-foreground">
              发布时间：{new Date(post.created_at).toLocaleString('zh-CN')}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>评论 ({comments.length})</CardTitle>
            <CardDescription>
              {user ? '匿名评论，保护您的隐私' : '登录后可参与讨论'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user && (
              <form onSubmit={handleSubmitComment} className="mb-6">
                <Textarea
                  placeholder="写下您的评论..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={submitting}
                  rows={4}
                />
                <div className="flex items-center justify-between mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      disabled={submitting}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-muted-foreground">匿名评论</span>
                  </label>
                  <Button type="submit" disabled={submitting || !comment.trim()}>
                    {submitting ? '提交中...' : '提交评论'}
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">暂无评论</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar>
                      {!comment.is_anonymous && comment.profiles?.avatar_url && (
                        <AvatarImage src={comment.profiles.avatar_url} />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        {comment.is_anonymous ? '匿' : comment.profiles?.nickname?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {comment.is_anonymous ? '匿名用户' : comment.profiles?.nickname || '用户'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(comment.created_at).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
