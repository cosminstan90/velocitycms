/**
 * Per-template design tokens used by shared page components
 * (TagPage, AuthorPage, StaticPage).
 *
 * Keep in sync with each template's visual language:
 *  default  — indigo accent, clean cards with shadow
 *  minimal  — gray/slate, serif body font, ultra-clean
 *  fauna    — amber accent, rounded cards with border
 */

export interface TemplateTheme {
  /** Body / page background */
  pageBg: string
  /** Sticky nav background + border */
  navBg: string
  navBorder: string
  /** Logo / site name text colour */
  navLogo: string
  /** Accent colour for category labels, badges, active pagination */
  accentBg: string
  accentText: string
  accentHoverBg: string
  accentHoverText: string
  /** Card styles */
  cardBg: string
  cardBorder: string
  /** Heading link hover */
  headingHover: string
  /** Pill/badge for counts, tags */
  pillBg: string
  pillText: string
  /** Body font family (CSS value) */
  fontFamily: string
  /** Prose heading class (for article content) */
  proseClass: string
}

const themes: Record<string, TemplateTheme> = {
  default: {
    pageBg: 'bg-gray-50',
    navBg: 'bg-white',
    navBorder: 'border-gray-100',
    navLogo: 'text-gray-900',
    accentBg: 'bg-indigo-500',
    accentText: 'text-white',
    accentHoverBg: 'hover:bg-indigo-600',
    accentHoverText: 'hover:text-indigo-700',
    cardBg: 'bg-white',
    cardBorder: 'border-gray-100',
    headingHover: 'group-hover:text-indigo-700',
    pillBg: 'bg-indigo-100',
    pillText: 'text-indigo-800',
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    proseClass: 'prose-indigo',
  },
  minimal: {
    pageBg: 'bg-white',
    navBg: 'bg-white',
    navBorder: 'border-gray-200',
    navLogo: 'text-gray-900',
    accentBg: 'bg-gray-900',
    accentText: 'text-white',
    accentHoverBg: 'hover:bg-gray-800',
    accentHoverText: 'hover:text-gray-900',
    cardBg: 'bg-white',
    cardBorder: 'border-gray-200',
    headingHover: 'group-hover:text-gray-600',
    pillBg: 'bg-gray-100',
    pillText: 'text-gray-700',
    fontFamily: 'Georgia, "Times New Roman", serif',
    proseClass: 'prose-gray',
  },
  fauna: {
    pageBg: 'bg-gray-50',
    navBg: 'bg-white',
    navBorder: 'border-gray-100',
    navLogo: 'text-gray-900',
    accentBg: 'bg-amber-500',
    accentText: 'text-white',
    accentHoverBg: 'hover:bg-amber-600',
    accentHoverText: 'hover:text-amber-700',
    cardBg: 'bg-white',
    cardBorder: 'border-gray-100',
    headingHover: 'group-hover:text-amber-700',
    pillBg: 'bg-amber-100',
    pillText: 'text-amber-800',
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    proseClass: 'prose-amber',
  },
}

export function getTheme(template: string): TemplateTheme {
  return themes[template] ?? themes.default
}
