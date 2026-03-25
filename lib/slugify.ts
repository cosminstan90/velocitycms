const diacriticsMap: Record<string, string> = {
  ă: 'a', â: 'a', î: 'i', ș: 's', ț: 't',
  Ă: 'a', Â: 'a', Î: 'i', Ș: 's', Ț: 't',
  ä: 'a', ö: 'o', ü: 'u', ß: 'ss',
  à: 'a', á: 'a', è: 'e', é: 'e', ê: 'e', ë: 'e',
  ì: 'i', í: 'i', ò: 'o', ó: 'o', ô: 'o', ù: 'u', ú: 'u',
  ñ: 'n', ç: 'c',
}

export function slugify(text: string): string {
  return text
    .split('')
    .map((ch) => diacriticsMap[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
}
