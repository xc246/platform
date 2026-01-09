import { Navbar } from '@/components/Navbar'
import { PostDetailContent } from './PostDetailContent'

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // 使用 await 获取 id
  const { id } = await params;

  return (
    <>
      <Navbar />
      <PostDetailContent postId={parseInt(id)} />
    </>
  );
}

