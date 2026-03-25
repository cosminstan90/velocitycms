/**
 * GEO/AEO Scorer — calculates how well a post is optimised
 * for Generative Engine Optimisation (ChatGPT, Perplexity, Google AI Overviews).
 *
 * Pure function: runs on server (in API routes) and can also run in the browser
 * because it has zero Node.js-specific dependencies.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeoFactorResult {
  score: number
  max: number
}

export interface GeoBreakdown {
  directAnswer:       GeoFactorResult & { wordCount: number; hasKeyword: boolean; endsWithPeriod: boolean }
  speakable:          GeoFactorResult & { h2Count: number; hasSpeakableSchema: boolean }
  structuredQA:       GeoFactorResult & { faqCount: number; avgAnswerWords: number }
  dataStats:          GeoFactorResult & { count: number }
  authorCredibility:  GeoFactorResult & { hasName: boolean; hasCredentials: boolean; inSchema: boolean }
  definitionBlock:    GeoFactorResult & { keywordInFirst100: boolean; hasDefinitionWord: boolean }
  comparisonTable:    GeoFactorResult & { hasComparison: boolean }
  citationReady:      GeoFactorResult & { avgSentenceWords: number }
}

export interface GeoScoreResult {
  score: number          // 0-100
  breakdown: GeoBreakdown
  suggestions: string[]
  speakableSections: string[]   // H2 text list
  directAnswerText: string | null // first <p> if ≤80 words
}

export interface GeoScorerInput {
  contentHtml: string
  contentJson?: Record<string, unknown>
  title?: string
  metaDescription?: string | null
  directAnswer?: string | null
  speakableSections?: unknown
  schemaMarkup?: unknown
  focusKeyword?: string | null
  author?: { name?: string | null; credentials?: string | null } | null
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

/** Extract the text content of the first <p> tag (non-empty). */
function extractFirstParagraph(html: string): string {
  const match = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  if (!match) return ''
  return stripHtml(match[1]).trim()
}

/** Extract all H2 text values from HTML. */
function extractH2Texts(html: string): string[] {
  const results: string[] = []
  const re = /<h2[^>]*>([\s\S]*?)<\/h2>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const text = stripHtml(m[1]).trim()
    if (text) results.push(text)
  }
  return results
}

/** Get first N words of plain text from HTML. */
function firstNWords(html: string, n: number): string {
  return stripHtml(html).split(/\s+/).slice(0, n).join(' ')
}

/** Average sentence length in words from plain text. */
function avgSentenceLength(html: string): number {
  const text = stripHtml(html)
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  if (sentences.length === 0) return 0
  const totalWords = sentences.reduce((sum, s) => sum + countWords(s), 0)
  return Math.round(totalWords / sentences.length)
}

/** Count statistics: numbers followed by % or in numeric context. */
function countStatistics(html: string): number {
  const text = stripHtml(html)
  // Match: "35%", "3,5 milioane", "47 de procente", "în 2023", "de 5 ori"
  const patterns = [
    /\d+([.,]\d+)?\s*%/g,                    // percentages
    /\d+([.,]\d+)?\s*(milioane?|miliard|mii|k|M)/gi, // large numbers
    /de\s+\d+\s+ori/gi,                       // multipliers
    /\b\d{4}\b/g,                             // years (statistical context)
  ]
  const matches = new Set<string>()
  for (const pattern of patterns) {
    let m: RegExpExecArray | null
    while ((m = pattern.exec(text)) !== null) {
      matches.add(m[0].toLowerCase())
    }
  }
  return matches.size
}

// ─── Tiptap JSON traversal ────────────────────────────────────────────────────

interface TiptapNode {
  type?: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
  text?: string
}

function findNodes(doc: unknown, type: string): TiptapNode[] {
  const results: TiptapNode[] = []
  function walk(node: TiptapNode) {
    if (node.type === type) results.push(node)
    node.content?.forEach(walk)
  }
  walk(doc as TiptapNode)
  return results
}

function parseFAQItems(block: TiptapNode): Array<{ question: string; answer: string }> {
  try {
    const raw = block.attrs?.['items']
    const items: Array<{ question: string; answer: string }> =
      typeof raw === 'string' ? JSON.parse(raw) : (raw as typeof items ?? [])
    return items.filter((i) => i.question && i.answer)
  } catch {
    return []
  }
}

// ─── Individual factor calculators ───────────────────────────────────────────

function scoreDirectAnswer(
  html: string,
  focusKeyword: string | null | undefined
): GeoBreakdown['directAnswer'] {
  const max = 20
  const firstPara = extractFirstParagraph(html)
  const wordCount = countWords(firstPara)
  const hasKeyword = focusKeyword
    ? firstPara.toLowerCase().includes(focusKeyword.toLowerCase())
    : true // no keyword set → don't penalise
  const endsWithPeriod = firstPara.endsWith('.')
  const isShort = wordCount > 0 && wordCount <= 60

  let score = 0
  if (isShort && endsWithPeriod && hasKeyword) score = max
  else if (isShort && hasKeyword) score = 14
  else if (isShort && endsWithPeriod) score = 12
  else if (isShort) score = 8
  else if (wordCount > 0 && wordCount <= 80) score = 5

  return { score, max, wordCount, hasKeyword, endsWithPeriod }
}

function scoreSpeakable(
  html: string,
  schemaMarkup: unknown
): GeoBreakdown['speakable'] & { sections: string[] } {
  const max = 15
  const sections = extractH2Texts(html)
  const h2Count = sections.length

  // Check if schema contains SpeakableSpecification
  const schemaStr = schemaMarkup ? JSON.stringify(schemaMarkup) : ''
  const hasSpeakableSchema = schemaStr.includes('SpeakableSpecification')

  let score = 0
  if (h2Count >= 3 && hasSpeakableSchema) score = max
  else if (h2Count >= 3) score = 10
  else if (h2Count >= 1 && hasSpeakableSchema) score = 10
  else if (h2Count >= 1) score = 8
  else score = 0

  return { score, max, h2Count, hasSpeakableSchema, sections }
}

function scoreStructuredQA(
  contentJson: Record<string, unknown> | undefined
): GeoBreakdown['structuredQA'] {
  const max = 15
  if (!contentJson) return { score: 0, max, faqCount: 0, avgAnswerWords: 0 }

  const faqBlocks = findNodes(contentJson, 'faqBlock')
  const allItems = faqBlocks.flatMap(parseFAQItems)
  const faqCount = allItems.length

  let score = 0
  let avgAnswerWords = 0

  if (faqCount >= 5) {
    score += 10
    const totalWords = allItems.reduce((sum, i) => sum + countWords(i.answer), 0)
    avgAnswerWords = Math.round(totalWords / allItems.length)
    if (avgAnswerWords <= 50) score += 5
  } else if (faqCount >= 1) {
    score += 5
  }

  return { score, max, faqCount, avgAnswerWords }
}

function scoreDataStats(html: string): GeoBreakdown['dataStats'] {
  const max = 10
  const count = countStatistics(html)
  const score = count >= 3 ? 10 : count === 2 ? 7 : count === 1 ? 3 : 0
  return { score, max, count }
}

function scoreAuthorCredibility(
  author: GeoScorerInput['author'],
  schemaMarkup: unknown
): GeoBreakdown['authorCredibility'] {
  const max = 10
  const hasName = !!(author?.name)
  const hasCredentials = !!(author?.credentials)
  const schemaStr = schemaMarkup ? JSON.stringify(schemaMarkup) : ''
  const inSchema = schemaStr.includes('"author"') && schemaStr.includes('"Person"')

  let score = 0
  if (hasName) score += 4
  if (hasCredentials) score += 4
  if (inSchema) score += 2

  return { score, max, hasName, hasCredentials, inSchema }
}

function scoreDefinitionBlock(
  html: string,
  focusKeyword: string | null | undefined
): GeoBreakdown['definitionBlock'] {
  const max = 10
  if (!focusKeyword) return { score: 0, max, keywordInFirst100: false, hasDefinitionWord: false }

  const first100 = firstNWords(html, 100).toLowerCase()
  const kw = focusKeyword.toLowerCase()
  const keywordInFirst100 = first100.includes(kw)

  const definitionWords = ['este', 'reprezintă', 'înseamnă', 'se referă', 'definit ca', 'definit prin']
  const hasDefinitionWord = definitionWords.some((w) => first100.includes(w))

  let score = 0
  if (keywordInFirst100 && hasDefinitionWord) score = max
  else if (keywordInFirst100) score = 5
  else if (hasDefinitionWord) score = 3

  return { score, max, keywordInFirst100, hasDefinitionWord }
}

function scoreComparisonTable(
  contentJson: Record<string, unknown> | undefined
): GeoBreakdown['comparisonTable'] {
  const max = 10
  const hasComparison = contentJson
    ? findNodes(contentJson, 'comparisonBlock').length > 0
    : false
  return { score: hasComparison ? max : 0, max, hasComparison }
}

function scoreCitationReady(html: string): GeoBreakdown['citationReady'] {
  const max = 10
  const avg = avgSentenceLength(html)
  const score = avg < 20 ? 10 : avg <= 25 ? 6 : 0
  return { score, max, avgSentenceWords: avg }
}

// ─── Suggestion builder ───────────────────────────────────────────────────────

function buildSuggestions(breakdown: GeoBreakdown): string[] {
  const suggestions: string[] = []

  if (breakdown.directAnswer.score < 20) {
    if (!breakdown.directAnswer.hasKeyword)
      suggestions.push('Primul paragraf nu conține cuvântul cheie — adaugă-l în primele 2 propoziții.')
    if (breakdown.directAnswer.wordCount > 60)
      suggestions.push(`Primul paragraf are ${breakdown.directAnswer.wordCount} cuvinte — scurtează-l sub 60 pentru a fi extras ca răspuns direct.`)
    else if (breakdown.directAnswer.wordCount === 0)
      suggestions.push('Articolul nu începe cu un paragraf — adaugă o definiție/răspuns concis la primul rând.')
    if (!breakdown.directAnswer.endsWithPeriod)
      suggestions.push('Primul paragraf trebuie să se termine cu punct pentru a fi citabil corect.')
  }

  if (breakdown.speakable.score < 15) {
    if (breakdown.speakable.h2Count < 3)
      suggestions.push(`Articolul are doar ${breakdown.speakable.h2Count} titluri H2 — adaugă cel puțin 3 secțiuni H2 pentru speakable markup.`)
    if (!breakdown.speakable.hasSpeakableSchema)
      suggestions.push('Lipsește SpeakableSpecification din schema JSON-LD — salvează articolul pentru a o genera automat.')
  }

  if (breakdown.structuredQA.score < 15) {
    if (breakdown.structuredQA.faqCount === 0)
      suggestions.push('Adaugă un bloc FAQ (tastează /faq în editor) cu cel puțin 5 întrebări relevante.')
    else if (breakdown.structuredQA.faqCount < 5)
      suggestions.push(`Blocul FAQ are ${breakdown.structuredQA.faqCount} întrebări — completează-l la minimum 5.`)
    if (breakdown.structuredQA.avgAnswerWords > 50)
      suggestions.push(`Răspunsurile din FAQ sunt prea lungi (medie ${breakdown.structuredQA.avgAnswerWords} cuvinte) — scurtează-le sub 50 cuvinte.`)
  }

  if (breakdown.dataStats.score < 10)
    suggestions.push(`Conținutul are ${breakdown.dataStats.count} statistici — adaugă cel puțin 3 date numerice cu surse (procente, cifre, ani).`)

  if (breakdown.authorCredibility.score < 10) {
    if (!breakdown.authorCredibility.hasName)
      suggestions.push('Autorul nu are nume configurat — adaugă-l în profilul utilizatorului.')
    if (!breakdown.authorCredibility.hasCredentials)
      suggestions.push('Autorul nu are credențiale (expert, titlu) — adaugă-le pentru autoritate E-E-A-T.')
  }

  if (breakdown.definitionBlock.score < 10) {
    if (!breakdown.definitionBlock.keywordInFirst100)
      suggestions.push('Cuvântul cheie nu apare în primele 100 cuvinte — menționează-l explicit la început.')
    if (!breakdown.definitionBlock.hasDefinitionWord)
      suggestions.push('Adaugă o definiție clară cu "este", "reprezintă" sau "înseamnă" în prima secțiune.')
  }

  if (!breakdown.comparisonTable.hasComparison)
    suggestions.push('Adaugă un tabel comparativ (/compare în editor) — crește șansele de citare în răspunsuri AI.')

  if (breakdown.citationReady.score < 10)
    suggestions.push(`Propozițiile sunt prea lungi (medie ${breakdown.citationReady.avgSentenceWords} cuvinte) — scurtează-le sub 20 cuvinte pentru citabilitate maximă.`)

  return suggestions
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function calculateGeoScore(input: GeoScorerInput): GeoScoreResult {
  const { contentHtml, contentJson, focusKeyword, schemaMarkup, author } = input

  const directAnswerFactor = scoreDirectAnswer(contentHtml, focusKeyword)
  const speakableFactor = scoreSpeakable(contentHtml, schemaMarkup)
  const structuredQAFactor = scoreStructuredQA(contentJson)
  const dataStatsFactor = scoreDataStats(contentHtml)
  const authorFactor = scoreAuthorCredibility(author, schemaMarkup)
  const definitionFactor = scoreDefinitionBlock(contentHtml, focusKeyword)
  const comparisonFactor = scoreComparisonTable(contentJson)
  const citationFactor = scoreCitationReady(contentHtml)

  const breakdown: GeoBreakdown = {
    directAnswer: directAnswerFactor,
    speakable: speakableFactor,
    structuredQA: structuredQAFactor,
    dataStats: dataStatsFactor,
    authorCredibility: authorFactor,
    definitionBlock: definitionFactor,
    comparisonTable: comparisonFactor,
    citationReady: citationFactor,
  }

  const score =
    directAnswerFactor.score +
    speakableFactor.score +
    structuredQAFactor.score +
    dataStatsFactor.score +
    authorFactor.score +
    definitionFactor.score +
    comparisonFactor.score +
    citationFactor.score

  const suggestions = buildSuggestions(breakdown)

  // Extract speakable sections (H2 list)
  const speakableSections = speakableFactor.sections

  // Extract direct answer text (first <p> ≤ 80 words)
  const firstPara = extractFirstParagraph(contentHtml)
  const directAnswerText = countWords(firstPara) <= 80 && firstPara.length > 0 ? firstPara : null

  return { score, breakdown, suggestions, speakableSections, directAnswerText }
}

/** Citability label based on score. */
export function citabilityLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Foarte ridicat', color: '#22c55e' }
  if (score >= 60) return { label: 'Ridicat', color: '#84cc16' }
  if (score >= 40) return { label: 'Mediu', color: '#f59e0b' }
  return { label: 'Scăzut', color: '#ef4444' }
}
