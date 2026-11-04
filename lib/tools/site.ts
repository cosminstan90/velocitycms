import { prisma } from '@/lib/prisma'

/** Numele si adresa site-ului activ, pentru paginile de instrumente. Nu arunca: la eroare foloseste valori implicite. */
export async function getToolsSite(): Promise<{ siteId: string | null; siteName: string; siteUrl: string }> {
  try {
    const site = await prisma.site.findFirst({ where: { isActive: true } })
    const seo = site ? await prisma.seoSettings.findFirst({ where: { siteId: site.id } }) : null
    return {
      siteId: site?.id ?? null,
      siteName: seo?.siteName ?? site?.name ?? 'DiVet',
      siteUrl: seo?.siteUrl ?? `http://${site?.domain ?? 'localhost'}`,
    }
  } catch {
    return { siteId: null, siteName: 'DiVet', siteUrl: 'http://localhost' }
  }
}

/** Slug-urile articolelor publicate din categoria data (ex. substante-toxice), ca sa nu linkam spre pagini inexistente. */
export async function publishedSlugs(siteId: string | null, subCategorySlug: string): Promise<string[]> {
  if (!siteId) return []
  try {
    const rows = await prisma.post.findMany({
      where: { siteId, status: 'PUBLISHED', category: { slug: subCategorySlug, parent: { slug: 'sanatate' } } },
      select: { slug: true },
    })
    return rows.map((r) => r.slug)
  } catch {
    return []
  }
}
