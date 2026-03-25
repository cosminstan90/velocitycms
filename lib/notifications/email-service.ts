/**
 * Email notification service using Brevo (formerly SendinBlue) REST API v3.
 * Env: BREVO_API_KEY, BREVO_FROM_EMAIL
 */

import { prisma } from '@/lib/prisma'

const BREVO_API = 'https://api.brevo.com/v3/smtp/email'

// ── Core sender ──────────────────────────────────────────────────────────────

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey || apiKey === 'placeholder') return // silently skip if not configured

  const fromEmail = process.env.BREVO_FROM_EMAIL ?? 'noreply@velocitycms.com'
  const fromName = 'VelocityCMS'

  const res = await fetch(BREVO_API, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Brevo API error ${res.status}: ${body}`)
  }
}

// ── Notification helpers ─────────────────────────────────────────────────────

function fmtSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function fmtDuration(ms: number | null): string {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function htmlWrap(title: string, color: string, body: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;background:#f1f5f9;margin:0;padding:32px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
  <div style="background:${color};padding:20px 28px">
    <h2 style="color:#fff;margin:0;font-size:18px">${title}</h2>
  </div>
  <div style="padding:24px 28px;color:#374151;font-size:14px;line-height:1.6">
    ${body}
  </div>
  <div style="padding:16px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8">
    VelocityCMS · ${new Date().toLocaleString('ro-RO')}
  </div>
</div>
</body></html>`
}

// ── Backup notifications ─────────────────────────────────────────────────────

export async function notifyBackupResult(
  siteId: string,
  result: {
    status: 'SUCCESS' | 'FAILED'
    type: string
    filePath: string | null
    fileSize: number | null
    duration: number
    error: string | null
  }
): Promise<void> {
  const seo = await prisma.seoSettings.findUnique({
    where: { siteId },
    select: { notifyEmail: true, notifyOnBackup: true },
  })
  if (!seo?.notifyOnBackup || !seo.notifyEmail) return

  const isSuccess = result.status === 'SUCCESS'
  const typeLabel = { DATABASE: 'Bază de date', MEDIA: 'Media', FULL: 'Complet' }[result.type] ?? result.type

  if (isSuccess) {
    const html = htmlWrap(
      `✅ Backup ${typeLabel} reușit`,
      '#059669',
      `<p>Backup-ul de tip <strong>${typeLabel}</strong> a fost finalizat cu succes.</p>
       <table style="width:100%;border-collapse:collapse;margin:16px 0">
         <tr><td style="padding:6px 0;color:#6b7280">Tip</td><td><strong>${typeLabel}</strong></td></tr>
         <tr><td style="padding:6px 0;color:#6b7280">Mărime</td><td><strong>${fmtSize(result.fileSize)}</strong></td></tr>
         <tr><td style="padding:6px 0;color:#6b7280">Durată</td><td><strong>${fmtDuration(result.duration)}</strong></td></tr>
         ${result.filePath ? `<tr><td style="padding:6px 0;color:#6b7280">Fișier</td><td style="font-family:monospace;font-size:12px;word-break:break-all">${result.filePath}</td></tr>` : ''}
       </table>`
    )
    await sendEmail(seo.notifyEmail, `✅ Backup ${typeLabel} reușit — VelocityCMS`, html)
  } else {
    const html = htmlWrap(
      `❌ Backup ${typeLabel} eșuat`,
      '#dc2626',
      `<p>Backup-ul de tip <strong>${typeLabel}</strong> a <strong>eșuat</strong>.</p>
       <p style="margin:12px 0 4px;font-weight:600;color:#dc2626">Eroare:</p>
       <pre style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px;font-size:12px;overflow-x:auto;white-space:pre-wrap">${result.error ?? 'Eroare necunoscută'}</pre>
       <p style="margin-top:16px;font-size:13px;color:#6b7280">
         Verificați configurația serverului (pg_dump, rsync, BACKUP_PATH) și reîncercați din Admin → Backup.
       </p>`
    )
    await sendEmail(seo.notifyEmail, `❌ Backup ${typeLabel} eșuat — VelocityCMS`, html)
  }
}

// ── Post published notification ─────────────────────────────────────────────

export async function notifyPostPublished(
  siteId: string,
  post: { title: string; slug: string; categorySlug?: string | null }
): Promise<void> {
  const seo = await prisma.seoSettings.findUnique({
    where: { siteId },
    select: { notifyEmail: true, notifyOnPublish: true, siteUrl: true },
  })
  if (!seo?.notifyOnPublish || !seo.notifyEmail) return

  const baseUrl = seo.siteUrl ?? 'http://localhost:3000'
  const postUrl = post.categorySlug
    ? `${baseUrl}/${post.categorySlug}/${post.slug}`
    : `${baseUrl}/blog/${post.slug}`

  const html = htmlWrap(
    '📄 Articol publicat',
    '#7c3aed',
    `<p>Un articol nou a fost publicat pe site.</p>
     <table style="width:100%;border-collapse:collapse;margin:16px 0">
       <tr><td style="padding:6px 0;color:#6b7280">Titlu</td><td><strong>${post.title}</strong></td></tr>
       <tr><td style="padding:6px 0;color:#6b7280">URL</td><td><a href="${postUrl}" style="color:#7c3aed">${postUrl}</a></td></tr>
       <tr><td style="padding:6px 0;color:#6b7280">Data</td><td>${new Date().toLocaleString('ro-RO')}</td></tr>
     </table>`
  )
  await sendEmail(seo.notifyEmail, `📄 Articol publicat: ${post.title}`, html)
}

// ── 404 spike alert ──────────────────────────────────────────────────────────

export async function check404SpikeAndNotify(siteId: string): Promise<boolean> {
  const seo = await prisma.seoSettings.findUnique({
    where: { siteId },
    select: { notifyEmail: true, notifyOnErrors: true },
  })
  if (!seo?.notifyOnErrors || !seo.notifyEmail) return false

  const since = new Date(Date.now() - 86_400_000) // last 24h
  const recent = await prisma.notFoundLog.findMany({
    where: { siteId, lastSeen: { gte: since } },
    orderBy: { hits: 'desc' },
    take: 15,
    select: { path: true, hits: true },
  })

  if (recent.length <= 10) return false

  const rows = recent
    .slice(0, 10)
    .map((r) => `<tr><td style="padding:4px 8px;font-family:monospace;font-size:12px">${r.path}</td><td style="padding:4px 8px;text-align:right">${r.hits}</td></tr>`)
    .join('')

  const html = htmlWrap(
    `⚠️ Spike de erori 404 (${recent.length} URL-uri în 24h)`,
    '#d97706',
    `<p>Au fost detectate <strong>${recent.length} URL-uri cu erori 404</strong> în ultimele 24 de ore.</p>
     <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px">
       <thead><tr style="background:#fef3c7">
         <th style="padding:6px 8px;text-align:left">Cale</th>
         <th style="padding:6px 8px;text-align:right">Hits</th>
       </tr></thead>
       <tbody>${rows}</tbody>
     </table>
     ${recent.length > 10 ? `<p style="font-size:12px;color:#6b7280">... și ${recent.length - 10} URL-uri adiționale.</p>` : ''}
     <p style="margin-top:16px;font-size:13px;color:#6b7280">
       Mergeți la <strong>Admin → Redirecturi → Monitor 404</strong> pentru a crea redirecționări.
     </p>`
  )

  await sendEmail(seo.notifyEmail, `⚠️ Spike 404: ${recent.length} URL-uri noi — VelocityCMS`, html)
  return true
}
