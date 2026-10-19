/**
 * Cautare fara diacritice, fara extensii Postgres si fara migrare: textul cautat se normalizeaza in JS,
 * iar coloanele se normalizeaza in SQL cu `translate` (functie standard, nu cere `unaccent`).
 * Cele doua liste de mai jos trebuie sa ramana la aceeasi lungime si sa se potriveasca pozitie cu pozitie.
 */
export const SQL_TRANSLATE_FROM = 'ăâîșşțţĂÂÎȘŞȚŢéèêëáàäöóôüúçñ'
export const SQL_TRANSLATE_TO = 'aaisstt' + 'AAISSTT' + 'eeeeaaaooouucn'

/** Fara diacritice si cu litere mici: „Câini" -> „caini", „Ţara" -> „tara". */
export function foldDiacritics(input: string): string {
  return input.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Escapeaza `%`, `_` si `\` ca textul utilizatorului sa fie cautat literal intr-un LIKE. */
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (c) => `\\${c}`)
}

/** Modelul LIKE pentru „contine": `%text-normalizat%`. */
export function toContainsPattern(query: string): string {
  return `%${escapeLike(foldDiacritics(query))}%`
}
