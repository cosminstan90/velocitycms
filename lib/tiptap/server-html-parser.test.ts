import { describe, it, expect } from 'vitest'
import { serverHtmlToTiptapJson } from './server-html-parser'

type Node = { type: string; content?: Node[]; text?: string; marks?: unknown[] }
const blocks = (html: string) => (serverHtmlToTiptapJson(html) as { content: Node[] }).content

describe('serverHtmlToTiptapJson — tabele', () => {
  const html =
    '<p>Intro.</p>' +
    '<table><thead><tr><th>Rasă</th><th>Talie</th></tr></thead>' +
    '<tbody><tr><td>Labrador</td><td>Mare</td></tr><tr><td><strong>Beagle</strong></td><td>Medie</td></tr></tbody></table>' +
    '<p>Final.</p>'

  it('un tabel devine un nod table, nu text', () => {
    const out = blocks(html)
    expect(out.map((n) => n.type)).toEqual(['paragraph', 'table', 'paragraph'])
    expect(JSON.stringify(out)).not.toContain('table>')
  })

  it('th -> tableHeader, td -> tableCell, cate un rand pe tr', () => {
    const table = blocks(html)[1]
    expect(table.content).toHaveLength(3)
    expect(table.content![0].content!.map((c) => c.type)).toEqual(['tableHeader', 'tableHeader'])
    expect(table.content![1].content!.map((c) => c.type)).toEqual(['tableCell', 'tableCell'])
  })

  it('celulele pastreaza textul si marcajele inline', () => {
    const table = blocks(html)[1]
    const firstCell = table.content![1].content![0]
    expect(firstCell.content![0]).toEqual({ type: 'paragraph', content: [{ type: 'text', text: 'Labrador' }] })
    const bold = table.content![2].content![0].content![0].content![0]
    expect(bold.text).toBe('Beagle')
    expect(bold.marks).toEqual([{ type: 'bold' }])
  })

  it('tabel fara thead/tbody, cu atribute pe taguri', () => {
    const out = blocks('<table class="x"><tr><td style="a:b">1</td><td>2</td></tr></table>')
    expect(out).toHaveLength(1)
    expect(out[0].type).toBe('table')
    expect(out[0].content![0].content).toHaveLength(2)
  })

  it('tabel gol nu produce niciun nod', () => {
    expect(blocks('<table></table>')).toEqual([{ type: 'paragraph', content: [] }])
  })
})
