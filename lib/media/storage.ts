/**
 * Centralised storage path helpers for media uploads.
 * All uploads live under:  public/media/uploads/[siteId]/
 * Public URL prefix:       /media/uploads/[siteId]/
 */

import path from 'path'

export const MEDIA_ROOT = path.join(process.cwd(), 'public', 'media', 'uploads')
export const MEDIA_PUBLIC_PREFIX = '/media/uploads'

/** Absolute path for a site's upload directory. */
export function siteUploadDir(siteId: string): string {
  return path.join(MEDIA_ROOT, siteId)
}

/** Public URL prefix for a site's uploads. */
export function sitePublicPrefix(siteId: string): string {
  return `${MEDIA_PUBLIC_PREFIX}/${siteId}`
}
