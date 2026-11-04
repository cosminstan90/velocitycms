/**
 * Vârsta câinelui în ani umani, după formula din Wang et al., Cell Systems 2020
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC7484147): human_age = 16 · ln(dog_age) + 31.
 * Formula a fost calibrată pe 104 Labrador retriever cu vârste între 0,1 și 16 ani, deci este orientativă.
 */

export const DOG_AGE_MIN = 0.25
/** Datele studiului ajung la 16 ani; peste această valoare rezultatul este o extrapolare. */
export const DOG_AGE_STUDY_MAX = 16
export const DOG_AGE_MAX = 25

export type DogAgeResult = {
  /** Vârsta umană echivalentă, rotunjită la un an întreg. */
  humanYears: number
  /** True dacă vârsta introdusă depășește intervalul studiat (extrapolare). */
  extrapolated: boolean
}

/** Transformă ani + luni într-un număr zecimal de ani. */
export function toDogYears(years: number, months: number): number {
  return years + months / 12
}

/** Returnează null pentru valori în afara intervalului acceptat (inclusiv NaN și negative). */
export function dogAgeInHumanYears(dogYears: number): DogAgeResult | null {
  if (!Number.isFinite(dogYears) || dogYears < DOG_AGE_MIN || dogYears > DOG_AGE_MAX) return null
  return {
    humanYears: Math.round(16 * Math.log(dogYears) + 31),
    extrapolated: dogYears > DOG_AGE_STUDY_MAX,
  }
}
