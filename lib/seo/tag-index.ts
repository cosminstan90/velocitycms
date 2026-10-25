/**
 * Etichetele cu putine articole sunt pagini subtiri (cateva zeci de cuvinte): le tinem
 * accesibile pentru vizitatori, dar le scoatem din index si din sitemap pana ajung la prag.
 */
export const MIN_INDEXABLE_TAG_POSTS = 3

export function isTagIndexable(publishedPostCount: number): boolean {
  return publishedPostCount >= MIN_INDEXABLE_TAG_POSTS
}
