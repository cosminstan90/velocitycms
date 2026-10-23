import { prisma } from '@/lib/prisma'
import { getHomeData, type HomeData } from '@/lib/home'
import DivetLayout from './DivetLayout'
import EmptyState from './EmptyState'
import HomeHero from './home/HomeHero'
import HomeStats from './home/HomeStats'
import GroupTiles from './home/GroupTiles'
import FeaturedSection from './home/FeaturedSection'
import LatestList from './home/LatestList'
import AboutFaq from './home/AboutFaq'

interface HomepageTemplateProps {
  // LEGACY: ignorat, datele vin din getHomeData
  latestPosts?: unknown
  categories?: unknown
  site: { siteName: string; siteUrl: string; defaultOgImage: string | null }
  seoSettings: { defaultMetaTitle: string | null; defaultMetaDesc: string | null } | null
}

const EMPTY_HOME: HomeData = { totalPosts: 0, groups: [], featured: [], mosaic: [], latest: [], updatedAt: null }

export default async function DivetHomepage({ site }: HomepageTemplateProps) {
  let home: HomeData = EMPTY_HOME
  try {
    const activeSite = await prisma.site.findFirst({ where: { isActive: true }, select: { id: true } })
    if (activeSite) home = await getHomeData(activeSite.id, site.siteUrl)
  } catch {
    home = EMPTY_HOME
  }

  const container = 'mx-auto w-full max-w-[1100px] px-4 md:px-10'

  return (
    <DivetLayout site={{ siteName: site.siteName, siteUrl: site.siteUrl }} headerSearch={false}>
      <div className={container}>
        <HomeHero home={home} />
      </div>
      {home.totalPosts > 0 ? <HomeStats home={home} /> : null}

      <div className={container}>
        {home.totalPosts > 0 ? (
          <>
            <GroupTiles groups={home.groups} />
            <FeaturedSection posts={home.featured} />
            <LatestList posts={home.latest} />
          </>
        ) : (
          <div className="py-12">
            <EmptyState
              title="Enciclopedia e în construcție"
              description="Primele fișe apar în curând. Între timp, răsfoiește grupurile din meniu."
            />
          </div>
        )}
        <AboutFaq />
      </div>
    </DivetLayout>
  )
}
