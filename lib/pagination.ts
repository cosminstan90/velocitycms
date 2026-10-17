/** Numarul maxim de pagina acceptat: `skip` al lui Prisma e un intreg pe 32 de biti. */
export const MAX_PAGE = 10000

/**
 * Pagina ceruta prin `?page=`, ca intreg intre 1 si MAX_PAGE.
 * Orice valoare care nu e un numar natural (text, zecimale, negative, lipsa) devine pagina 1:
 * `Math.max(1, parseInt('abc'))` e NaN, iar `skip: NaN` face ca Prisma sa arunce eroare (500).
 * Un parametru repetat (`?page=2&page=5`) conteaza prin prima valoare.
 */
export function parsePageParam(raw: string | string[] | null | undefined): number {
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim()
  if (!value || !/^\d+$/.test(value)) return 1
  const n = Number(value)
  if (n < 1) return 1
  return Math.min(n, MAX_PAGE)
}
