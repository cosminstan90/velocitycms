/** HTML -> text simplu pentru llms-full.txt: titlurile devin linii markdown, listele linii cu "-", tabelele linii cu "|". */
export function htmlToPlainText(html: string): string {
  const decode = (s: string) =>
    s
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
  return decode(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      .replace(/<h([1-6])[^>]*>/gi, (_m, n: string) => `\n\n${'#'.repeat(Number(n))} `)
      .replace(/<\/(h[1-6]|p|div|section|ul|ol|table|blockquote|figure)>/gi, '\n\n')
      .replace(/<li[^>]*>/gi, '\n- ')
      .replace(/<\/tr>/gi, '\n')
      .replace(/<\/t[dh]>/gi, ' | ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
