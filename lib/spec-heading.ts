/** Titlul blocului de specificatii, dupa grupul articolului: „rasei" are sens doar la caini si pisici. */
export function specHeading(groupSlug: string | null | undefined): string {
  return groupSlug === 'caini' || groupSlug === 'pisici' ? 'Caracteristicile rasei' : 'Caracteristici'
}
