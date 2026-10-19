/**
 * Centralised storage path helpers for media uploads.
 * All uploads live under:  public/media/uploads/[siteId]/
 * Public URL prefix:       /media/uploads/[siteId]/
 */

import path from 'path'

export const MEDIA_ROOT = path.join(process.cwd(), 'public', 'media', 'uploads')
export const MEDIA_PUBLIC_PREFIX = '/media/uploads'

/** Uploads root; a function so runtime consumers (and tests) can resolve it lazily. */
export function getMediaRoot(): string {
  return MEDIA_ROOT
}

/** Absolute path for a site's upload directory. */
export function siteUploadDir(siteId: string): string {
  return path.join(MEDIA_ROOT, siteId)
}

/** Public URL prefix for a site's uploads. */
export function sitePublicPrefix(siteId: string): string {
  return `${MEDIA_PUBLIC_PREFIX}/${siteId}`
}
