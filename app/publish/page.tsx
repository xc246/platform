'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { ITEM_CATEGORIES, COMMON_LOCATIONS } from '@/lib/constants'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

export default function PublishPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [postType, setPostType] = useState<'lost' | 'found'>('lost')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [itemCategory, setItemCategory] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [customLocation, setCustomLocation] = useState('')
  const [lostFoundDate, setLostFoundDate] = useState(new Date().toISOString().split('T')[0])
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // 获取最终使用的地点值
  const location = customLocation || selectedLocation

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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>请先登录</CardTitle>
            <CardDescription>您需要登录才能发布信息</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/login?redirect=/publish')} className="w-full">
              前往登录
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => file.size <= 5 * 1024 * 1024)

    if (validFiles.length !== files.length) {
      setError('部分文件超过 5MB 限制，已被忽略')
    }

    const previews = validFiles.map(file => URL.createObjectURL(file))
    setImages(prev => [...prev, ...validFiles])
    setImagePreviews(prev => [...prev, ...previews])
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = []

    for (const file of images) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(filePath, file)

      if (error) {
        throw new Error(`图片上传失败: ${error.message}`)
      }

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath)

      uploadedUrls.push(publicUrl)
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!title.trim()) {
      setError('请输入物品名称')
      setLoading(false)
      return
    }

    if (!location.trim()) {
      setError('请输入地点')
      setLoading(false)
      return
    }

    if (!lostFoundDate) {
      setError('请选择日期')
      setLoading(false)
      return
    }

    try {
      const imageUrls = images.length > 0 ? await uploadImages() : []

      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        type: postType,
        title: title.trim(),
        description: description.trim() || null,
        item_category: itemCategory || null,
        location: location.trim(),
        lost_found_date: lostFoundDate,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
      })

      if (insertError) throw insertError

      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">发布信息</CardTitle>
              <CardDescription>
                帮助他人找回失物，或发布您捡到的物品
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs value={postType} onValueChange={(v) => setPostType(v as 'lost' | 'found')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="lost">失物登记</TabsTrigger>
                    <TabsTrigger value="found">招领登记</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="space-y-2">
                  <Label htmlFor="title">
                    物品名称 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="例如：白色校园卡、黑色书包"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">物品类别</Label>
                  <Select value={itemCategory} onValueChange={setItemCategory} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择物品类别" />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEM_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">
                    {postType === 'lost' ? '丢失地点' : '捡到地点'} <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={selectedLocation} 
                    onValueChange={(value) => {
                      setSelectedLocation(value)
                      setCustomLocation('')
                    }} 
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择常用地点" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_LOCATIONS.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="location-input"
                    type="text"
                    placeholder="或输入具体地点（输入后下拉选择会自动清空）"
                    value={customLocation}
                    onChange={(e) => {
                      setCustomLocation(e.target.value)
                      setSelectedLocation('')
                    }}
                    disabled={loading}
                    className="mt-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">
                    {postType === 'lost' ? '丢失日期' : '捡到日期'} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    placeholder="年/月/日"
                    value={lostFoundDate}
                    onChange={(e) => setLostFoundDate(e.target.value)}
                    disabled={loading}
                    required
                    lang="zh-CN"
                    className="[color-scheme:light]"
                  />
                  {lostFoundDate && (
                    <p className="text-sm text-muted-foreground">
                      已选择：{new Date(lostFoundDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">物品描述</Label>
                  <Textarea
                    id="description"
                    placeholder="请详细描述物品的特征、颜色、品牌等信息"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>上传图片（可选，最多5张）</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      disabled={loading || images.length >= 5}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600">
                        点击或拖拽上传图片
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        支持 JPG、PNG、GIF，每张图片不超过 5MB
                      </p>
                    </label>
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <div className="relative h-32 w-full rounded-lg overflow-hidden">
                            <Image
                              src={preview}
                              alt={`预览 ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={loading}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                    className="flex-1"
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? '发布中...' : '发布'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
