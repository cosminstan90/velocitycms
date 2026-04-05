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
  divet: {
    pageBg: 'bg-[#f3ecdf]',
    navBg: 'bg-[#fff7ef]/95 backdrop-blur',
    navBorder: 'border-[#d8cbb7]',
    navLogo: 'text-[#173127]',
    accentBg: 'bg-[#c77b2d]',
    accentText: 'text-white',
    accentHoverBg: 'hover:bg-[#9b5725]',
    accentHoverText: 'hover:text-[#9b5725]',
    cardBg: 'bg-[#fffaf3]',
    cardBorder: 'border-[#d8cbb7]',
    headingHover: 'group-hover:text-[#9b5725]',
    pillBg: 'bg-[#efe0cd]',
    pillText: 'text-[#7e5125]',
    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
    proseClass: 'prose-stone',
  },
}

export function getTheme(template: string): TemplateTheme {
  return themes[template] ?? themes.default
}
