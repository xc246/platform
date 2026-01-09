'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { useMessages } from '@/hooks/useMessages'
import { Bell, Check, CheckCheck, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function MessagesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { messages, unreadCount, markAsRead, markAllAsRead } = useMessages(user)

  useEffect(() => {
    // 只在确认用户未登录且不是正在加载时才重定向
    if (!authLoading && !user) {
      router.push('/login?redirect=/messages')
    }
  }, [user, authLoading, router])

  // 显示加载状态
  if (authLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-16">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">加载中...</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  // 未登录时返回 null（等待 useEffect 触发重定向）
  if (!user) {
    return null
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700">
              <ArrowLeft className="w-4 h-4" />
              返回首页
            </Link>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">
                {unreadCount} 条未读
              </Badge>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  className="gap-2"
                >
                  <CheckCheck className="w-4 h-4" />
                  全部已读
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {messages.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">暂无消息</p>
                </CardContent>
              </Card>
            ) : (
              messages.map((message) => (
                <Link
                  key={message.id}
                  href={`/post/${message.post_id}`}
                  onClick={() => !message.is_read && markAsRead(message.id)}
                >
                  <Card
                    className={`hover:shadow-md transition-shadow cursor-pointer ${
                      !message.is_read ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`mt-1 ${
                            !message.is_read ? 'text-blue-600' : 'text-gray-400'
                          }`}
                        >
                          {!message.is_read ? <Bell className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`mb-2 ${
                              !message.is_read ? 'font-medium' : 'text-gray-600'
                            }`}
                          >
                            {message.content}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(message.created_at).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        {!message.is_read && (
                          <Badge variant="default" className="shrink-0">
                            新
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
