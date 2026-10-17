import path from 'path'

const DEFAULT_BACKUP_ROOT = '/backups'

function normalizeSlashes(value: string): string {
  return value.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/\/$/, '')
}

export function getBackupRoot(): string {
  return process.env.BACKUP_PATH?.trim() || DEFAULT_BACKUP_ROOT
}

export function toBackupRelativePath(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const normalizedRoot = normalizeSlashes(getBackupRoot())
  const normalizedInput = normalizeSlashes(trimmed)

  const relativeCandidate =
    normalizedInput === normalizedRoot
      ? ''
      : normalizedInput.startsWith(`${normalizedRoot}/`)
        ? normalizedInput.slice(normalizedRoot.length + 1)
        : normalizedInput.replace(/^\/+/, '')

  const normalizedRelative = path.posix.normalize(relativeCandidate)
  if (
    !normalizedRelative ||
    normalizedRelative === '.' ||
    normalizedRelative === '..' ||
    normalizedRelative.startsWith('../')
  ) {
    return null
  }

  return normalizedRelative
}

export function resolveBackupPath(input: string): string | null {
  const relativePath = toBackupRelativePath(input)
  if (!relativePath) return null

  const configuredPath = process.env.BACKUP_PATH?.trim()
  if (configuredPath) {
    return path.join(/* turbopackIgnore: true */ configuredPath, relativePath)
  }

  return path.join(DEFAULT_BACKUP_ROOT, relativePath)
}
