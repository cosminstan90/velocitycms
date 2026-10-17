import ArticleCard from './ArticleCard'
import { toCardProps, type PostListItem } from '@/lib/post-card'

export default function PostGrid({ posts, siteUrl }: { posts: PostListItem[]; siteUrl: string }) {
  return (
    <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => {
        const props = toCardProps(post, siteUrl)
        return <ArticleCard key={props.href} {...props} />
      })}
    </div>
  )
}
