'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Calendar, User as UserIcon, Mail, Edit, Camera, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Post } from '@/types'

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editNickname, setEditNickname] = useState(profile?.nickname || '')
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    if (profile?.nickname) {
      setEditNickname(profile.nickname)
    }
  }, [profile])

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!user) return

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setUserPosts(data)
      }
      setLoading(false)
    }

    if (user) {
      fetchUserPosts()
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/profile')
    }
  }, [user, authLoading, router])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过 5MB')
      return
    }

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const uploadAvatar = async (): Promise<string | null> => {
    if (!user || !avatarFile) return null

    console.log('=== 开始上传头像 ===')
    console.log('用户 ID:', user.id)
    console.log('用户 ID 类型:', typeof user.id)

    const fileExt = avatarFile.name.split('.').pop()
    const fileName = `avatar.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    console.log('文件路径:', filePath)
    console.log('文件大小:', avatarFile.size, 'bytes')
    console.log('文件类型:', avatarFile.type)

    try {
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(filePath, avatarFile, {
          upsert: true,
          cacheControl: '3600'
        })

      console.log('上传响应 data:', data)
      console.log('上传响应 error:', error)

      if (error) {
        console.error('=== Storage 上传完整错误对象 ===')
        console.error('Error:', JSON.stringify(error, null, 2))
        console.error('Error keys:', Object.keys(error))
        console.error('Error message:', error.message)
        console.error('Error statusCode:', error.statusCode)
        console.error('Error error:', error.error)

        const errorMsg = error.message || JSON.stringify(error)
        throw new Error(`头像上传失败: ${errorMsg}`)
      }

      console.log('上传成功，数据:', data)

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath)

      console.log('公开 URL:', publicUrl)

      return publicUrl
    } catch (uploadErr) {
      console.error('=== 上传异常 ===')
      console.error(uploadErr)
      throw uploadErr
    }
  }

  const handleUpdateProfile = async () => {
    if (!user) {
      alert('用户未登录')
      return
    }

    setUploading(true)

    try {
      const updateData: { nickname?: string; avatar_url?: string } = {}

      if (editNickname.trim()) {
        updateData.nickname = editNickname.trim()
      }

      // 只在有头像文件时才上传
      if (avatarFile) {
        console.log('开始上传头像...')
        const avatarUrl = await uploadAvatar()
        if (avatarUrl) {
          console.log('头像上传成功，URL:', avatarUrl)
          updateData.avatar_url = avatarUrl
        } else {
          console.error('头像上传失败，返回 null')
          throw new Error('头像上传失败')
        }
      }

      // 如果没有任何需要更新的数据，直接返回
      if (Object.keys(updateData).length === 0) {
        alert('没有需要更新的信息')
        return
      }

      console.log('=== 准备更新 profile ===')
      console.log('用户 ID:', user.id)
      console.log('用户 ID 类型:', typeof user.id)
      console.log('更新数据:', updateData)

      // 先查询当前 profile 是否存在
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (fetchError) {
        console.error('查询 profile 失败:', fetchError)
        console.error('错误对象:', JSON.stringify(fetchError, null, 2))
        throw new Error(`无法查询 profile: ${JSON.stringify(fetchError)}`)
      }

      if (!currentProfile) {
        console.error('Profile 不存在:', user.id)
        throw new Error('用户 profile 不存在')
      }

      console.log('当前 profile 存在，准备更新...')

      // 执行更新
      const { error, data } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()

      if (error) {
        console.error('=== 更新 profile 失败 ===')
        console.error('错误对象:', JSON.stringify(error, null, 2))
        console.error('错误代码:', error.code)
        console.error('错误信息:', error.message)
        console.error('错误详情:', error.details)
        console.error('错误提示:', error.hint)
        const errorMsg = error.message || JSON.stringify(error)
        throw new Error(`更新失败: ${errorMsg}`)
      }

      console.log('更新成功，结果:', data)
      setIsEditing(false)
      setAvatarFile(null)
      router.refresh()
      alert('更新成功！')
    } catch (err) {
      console.error('=== 处理异常 ===')
      console.error(err)
      alert(err instanceof Error ? err.message : '更新失败')
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePost = async (postId: number) => {
    if (!user) return

    const confirmed = window.confirm('确定要删除这条帖子吗？此操作不可恢复。')
    if (!confirmed) return

    setDeleting(postId)

    try {
      // 获取帖子信息，以便删除关联的图片
      const { data: post } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single()

      if (!post) throw new Error('帖子不存在')

      // 删除帖子关联的图片
      if (post.image_urls && post.image_urls.length > 0) {
        for (const imageUrl of post.image_urls) {
          try {
            // 从 URL 中提取文件路径
            const url = new URL(imageUrl)
            const pathParts = url.pathname.split('/post-images/')
            if (pathParts.length > 1) {
              const filePath = pathParts[1]
              await supabase.storage
                .from('post-images')
                .remove([filePath])
            }
          } catch (err) {
            console.error('删除图片失败:', err)
          }
        }
      }

      // 删除帖子（评论会通过级联删除自动删除）
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      // 从列表中移除已删除的帖子
      setUserPosts(prev => prev.filter(p => p.id !== postId))
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    } finally {
      setDeleting(null)
    }
  }

  if (authLoading || loading) {
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

  if (!user) {
    return null
  }

  const openPostsCount = userPosts.filter(p => p.status === 'open').length
  const closedPostsCount = userPosts.filter(p => p.status === 'closed').length
  const lostPostsCount = userPosts.filter(p => p.type === 'lost').length
  const foundPostsCount = userPosts.filter(p => p.type === 'found').length

  // 根据筛选条件过滤帖子
  const filteredPosts = filter === 'all'
    ? userPosts
    : userPosts.filter(p => p.status === filter)

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>

          <div className="grid gap-6">
            {/* 用户信息卡片 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>个人信息</CardTitle>
                  {!isEditing ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      编辑
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                        取消
                      </Button>
                      <Button size="sm" onClick={handleUpdateProfile} disabled={uploading}>
                        {uploading ? '上传中...' : '保存'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      {profile?.avatar_url || avatarPreview ? (
                        <AvatarImage src={avatarPreview || profile?.avatar_url} />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-3xl">
                        {profile?.nickname?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-md">
                        <Camera className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                          id="avatar-upload"
                        />
                      </label>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-muted-foreground">昵称</label>
                          <input
                            type="text"
                            value={editNickname}
                            onChange={(e) => setEditNickname(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="输入昵称"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {profile?.nickname || '未设置昵称'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span>{user.email}</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>
                        注册时间：{new Date(user.created_at || profile?.created_at).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 统计信息 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card
                className={`cursor-pointer transition-all hover:shadow-md ${
                  filter === 'all' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setFilter(filter === 'all' ? 'all' : 'all')}
              >
                <CardContent className="pt-6 text-center">
                  <p className={`text-3xl font-bold ${filter === 'all' ? 'text-blue-600' : 'text-gray-600'}`}>
                    {userPosts.length}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">发布总数</p>
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer transition-all hover:shadow-md ${
                  filter === 'open' ? 'ring-2 ring-orange-500 bg-orange-50' : ''
                }`}
                onClick={() => setFilter(filter === 'open' ? 'all' : 'open')}
              >
                <CardContent className="pt-6 text-center">
                  <p className={`text-3xl font-bold ${filter === 'open' ? 'text-orange-600' : 'text-gray-600'}`}>
                    {openPostsCount}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">进行中</p>
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer transition-all hover:shadow-md ${
                  filter === 'closed' ? 'ring-2 ring-green-500 bg-green-50' : ''
                }`}
                onClick={() => setFilter(filter === 'closed' ? 'all' : 'closed')}
              >
                <CardContent className="pt-6 text-center">
                  <p className={`text-3xl font-bold ${filter === 'closed' ? 'text-green-600' : 'text-gray-600'}`}>
                    {closedPostsCount}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">已完成</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="flex justify-center gap-1">
                    <p className="text-3xl font-bold text-red-600">{lostPostsCount}</p>
                    <span className="text-muted-foreground">/</span>
                    <p className="text-3xl font-bold text-blue-600">{foundPostsCount}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">失物 / 招领</p>
                </CardContent>
              </Card>
            </div>

            {/* 我发布的帖子 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    我发布的帖子
                    {filter !== 'all' && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        - {filter === 'open' ? '进行中' : '已完成'}
                        <button
                          onClick={() => setFilter('all')}
                          className="ml-2 text-blue-600 hover:text-blue-700"
                        >
                          清除筛选
                        </button>
                      </span>
                    )}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {filteredPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-4">
                      {filter !== 'all' ? '该分类下暂无帖子' : '还没有发布过帖子'}
                    </p>
                    {filter === 'all' && (
                      <Link href="/publish">
                        <Button>发布第一条</Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPosts.map((post) => (
                      <div key={post.id} className="block relative">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDeletePost(post.id)
                          }}
                          disabled={deleting === post.id}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed z-10"
                          title="删除帖子"
                        >
                          {deleting === post.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                        <Link href={`/post/${post.id}`} className="block">
                          <Card className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <div className="flex-1 pr-6">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant={post.type === 'lost' ? 'destructive' : 'default'}>
                                      {post.type === 'lost' ? '失物' : '招领'}
                                    </Badge>
                                    {post.item_category && (
                                      <Badge variant="secondary">
                                        {post.item_category}
                                      </Badge>
                                    )}
                                    <Badge
                                      variant={post.status === 'open' ? 'default' : 'secondary'}
                                    >
                                      {post.status === 'open' ? '进行中' : '已完成'}
                                    </Badge>
                                  </div>
                                  <h3 className="font-medium mb-1">{post.title}</h3>
                                  {post.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {post.description}
                                    </p>
                                  )}
                                  {post.location && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      地点：{post.location}
                                    </p>
                                  )}
                                  {post.lost_found_date && (
                                    <p className="text-sm text-muted-foreground">
                                      日期：{new Date(post.lost_found_date).toLocaleDateString('zh-CN')}
                                    </p>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground whitespace-nowrap text-right">
                                  {new Date(post.created_at).toLocaleDateString('zh-CN')}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
