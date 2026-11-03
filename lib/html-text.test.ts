import { describe, it, expect } from 'vitest'
import { htmlToPlainText } from './html-text'

describe('htmlToPlainText', () => {
  it('turns headings, lists and entities into readable text', () => {
    const out = htmlToPlainText('<h2>Origine</h2><p>Rasa &amp; istoria</p><ul><li>unu</li><li>doi</li></ul>')
    expect(out).toContain('## Origine')
    expect(out).toContain('Rasa & istoria')
    expect(out).toContain('- unu')
    expect(out).toContain('- doi')
  })

  it('drops scripts and styles and keeps table cells separated', () => {
    const out = htmlToPlainText('<script>x()</script><table><tr><td>A</td><td>B</td></tr></table>')
    expect(out).not.toContain('x()')
    expect(out).toContain('A |')
    expect(out).toContain('B |')
  })
})
