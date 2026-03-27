export interface TemplateInfo {
  id: string
  name: string
  description: string
}

export const TEMPLATES: TemplateInfo[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Design modern cu hero section, grid de articole și secțiune categorii.',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Design curat, text-first, fără distrageri — ideal pentru publicații de nișă.',
  },
  {
    id: 'fauna',
    name: 'Fauna',
    description: 'Design editorial pentru animale și rase — optimizat pentru EEAT, reclame și SEO.',
  },
]

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id)

export function isValidTemplate(id: string): boolean {
  return TEMPLATE_IDS.includes(id)
}
