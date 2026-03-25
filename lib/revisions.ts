export interface Revision {
  version: number
  savedAt: string
  savedBy: string
  title: string
  contentJson: unknown
  contentHtml: string
  metaTitle: string | null
  metaDescription: string | null
  status: string
}

const MAX_REVISIONS = 20

export function appendRevision(
  existing: unknown,
  data: Omit<Revision, 'version'> & { version?: number }
): Revision[] {
  const revisions: Revision[] = Array.isArray(existing) ? (existing as Revision[]) : []
  const next: Revision = {
    ...data,
    version: revisions.length + 1,
  }
  const updated = [...revisions, next]
  // Keep only the latest MAX_REVISIONS
  return updated.slice(-MAX_REVISIONS)
}
