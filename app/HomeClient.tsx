'use client'

import { useState } from 'react'
import { usePosts } from '@/hooks/usePosts'
import { Navbar } from '@/components/Navbar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, MapPin, Calendar, User, Filter } from 'lucide-react'
import { ITEM_CATEGORIES, COMMON_LOCATIONS, ITEM_CATEGORIES_MAP } from '@/lib/constants'
import Link from 'next/link'
import Image from 'next/image'

export default function HomeClient() {
  const [activeTab, setActiveTab] = useState<'all' | 'lost' | 'found'>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedLocation, setSelectedLocation] = useState<string>('')

  const { posts, loading } = usePosts(activeTab === 'all' ? undefined : activeTab)

  const filteredPosts = posts.filter((post) => {
    const matchesKeyword = !searchKeyword ||
      post.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      post.description?.toLowerCase().includes(searchKeyword.toLowerCase())

    const matchesCategory = !selectedCategory || post.item_category === selectedCategory

    const matchesLocation = !selectedLocation || post.location?.includes(selectedLocation)

    return matchesKeyword && matchesCategory && matchesLocation
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
              校园寻物招领平台
            </h1>
            <p className="text-lg text-muted-foreground">
              帮助您快速找回失物，轻松发布招领信息
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-6">
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="lost">失物</TabsTrigger>
                <TabsTrigger value="found">招领</TabsTrigger>
              </TabsList>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="搜索物品..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择类别" />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择地点" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_LOCATIONS.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchKeyword('')
                    setSelectedCategory('')
                    setSelectedLocation('')
                  }}
                  className="gap-2"
                >
                  <Filter className="w-4 h-4" />
                  清除筛选
                </Button>
              </div>
            </Tabs>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">暂无相关信息</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="group"
                >
                  <Card className={`h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 overflow-hidden ${post.status === 'closed' ? 'opacity-70' : ''}`}>
                    {post.image_urls && post.image_urls.length > 0 && (
                      <div className="relative h-48 w-full bg-gray-100">
                        <Image
                          src={post.image_urls[0]}
                          alt={post.title}
                          fill
                          className={`object-cover group-hover:scale-105 transition-transform duration-300 ${post.status === 'closed' ? 'grayscale' : ''}`}
                        />
                        <div className="absolute top-3 right-3 flex gap-2">
                          <Badge
                            variant={post.type === 'lost' ? 'lost' : 'found'}
                          >
                            {post.type === 'lost' ? '失物' : '招领'}
                          </Badge>
                          {post.status === 'closed' && (
                            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                              <Check className="w-3 h-3 mr-1" />
                              已找到
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="line-clamp-2 text-lg">{post.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4" />
                        {post.location || '未知地点'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                        <Avatar className="w-8 h-8">
                          {post.profiles?.avatar_url && (
                            <AvatarImage src={post.profiles.avatar_url} />
                          )}
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm">
                            {post.profiles?.nickname?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {post.profiles?.nickname || '匿名用户'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {post.lost_found_date
                            ? new Date(post.lost_found_date).toLocaleDateString('zh-CN')
                            : '未知时间'}
                        </div>
                        {post.item_category && (
                          <Badge variant="secondary" className="text-xs">
                            {ITEM_CATEGORIES_MAP[post.item_category as keyof typeof ITEM_CATEGORIES_MAP] || post.item_category}
                          </Badge>
                        )}
                        {post.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mt-3">
                            {post.description}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
