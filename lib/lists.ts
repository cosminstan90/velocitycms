/**
 * Liste filtrate „Rase de ... " (/liste/<slug>), generate din câmpurile fișelor.
 *
 * O listă se publică DOAR dacă filtrul este util:
 *  - are cel puțin MIN_LIST_ENTRIES intrări (altfel ar fi pagină subțire);
 *  - nu conține aproape toate fișele grupului (un filtru care le include pe toate nu filtrează nimic).
 * Textele editoriale (intro + FAQ) sunt scrise aici, nu generate.
 */

export type ListGroup = 'caini' | 'pisici'

export type ListDefinition = {
  slug: string
  group: ListGroup
  /** Titlul paginii (H1). */
  title: string
  metaTitle: string
  metaDesc: string
  /** Filtru pe valorile câmpurilor fișei (chei: fieldKey; valori: textul din fișă). */
  match: (f: FieldMap) => boolean
  /** Ce criterii folosește, afișat deasupra listei. */
  criteria: string
  intro: string[]
  faq: Array<{ question: string; answer: string }>
}

export type FieldMap = Record<string, string | undefined>

export const MIN_LIST_ENTRIES = 8
/** O listă care conține mai mult de această proporție din fișele grupului nu este un filtru util. */
export const MAX_LIST_SHARE = 0.8

export function minEntries(): number {
  const raw = Number(process.env.LISTS_MIN_ENTRIES)
  // doar pentru verificare locala; in productie ramane MIN_LIST_ENTRIES
  return process.env.NODE_ENV !== 'production' && Number.isInteger(raw) && raw >= 1 ? raw : MIN_LIST_ENTRIES
}

function norm(v: string | undefined): string {
  return (v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
}

const is = (f: FieldMap, key: string, ...values: string[]) => values.map(norm).includes(norm(f[key]))

export const LISTS: readonly ListDefinition[] = [
  {
    slug: 'rase-de-caini-mici',
    group: 'caini',
    title: 'Rase de câini mici',
    metaTitle: 'Rase de câini mici: lista fișelor DiVet',
    metaDesc: 'Rase de câini de talie mică din enciclopedia DiVet: temperament, nevoie de mișcare și îngrijire pentru fiecare, cu link spre fișa completă.',
    match: (f) => is(f, 'talie', 'Mic'),
    criteria: 'Rasele din fișele DiVet la care câmpul „Talie” este „Mic”.',
    intro: [
      'Câinii de talie mică se potrivesc de obicei locuințelor mici și stăpânilor care nu pot oferi ore de alergat. Talia mică nu înseamnă însă nevoi mici: multe rase mici sunt energice, latră mult sau cer atenție constantă.',
      'Lista de mai jos conține rasele cu fișă pe DiVet. Fiecare fișă are profilul comportamental și îngrijirea, așa că poți compara înainte să te decizi. Pentru probleme de sănătate frecvente, vezi secțiunea de pe fișa rasei.',
    ],
    faq: [
      { question: 'Un câine mic este mai ușor de crescut?', answer: 'Nu neapărat. Talia mică reduce spațiul necesar, dar nevoia de mișcare, de dresaj și de companie depinde de rasă și se vede în fișa fiecăreia.' },
      { question: 'Cum aleg între mai multe rase mici?', answer: 'Compară în fișe nivelul de energie, toleranța la singurătate și îngrijirea blănii, apoi alege după timpul pe care îl poți oferi zilnic.' },
      { question: 'Lista conține toate rasele mici?', answer: 'Doar rasele care au fișă publicată pe DiVet. Lista se completează pe măsură ce adăugăm fișe noi.' },
    ],
  },
  {
    slug: 'rase-de-caini-medii',
    group: 'caini',
    title: 'Rase de câini de talie medie',
    metaTitle: 'Rase de câini de talie medie: lista DiVet',
    metaDesc: 'Rase de câini de talie medie din enciclopedia DiVet, cu temperament, nevoi de mișcare și îngrijire, ca să compari înainte să alegi.',
    match: (f) => is(f, 'talie', 'Mediu'),
    criteria: 'Rasele din fișele DiVet la care câmpul „Talie” este „Mediu”.',
    intro: [
      'Rasele de talie medie sunt adesea un compromis între cele mici și cele mari: au nevoie de spațiu și de plimbări regulate, dar se descurcă și într-un apartament dacă primesc mișcare suficientă.',
      'Lista conține rasele cu fișă pe DiVet. Deschide fișele pentru profilul comportamental, speranța de viață și îngrijire, și folosește comparațiile atunci când ezitați între două rase apropiate.',
    ],
    faq: [
      { question: 'Ce înseamnă talie medie în fișele DiVet?', answer: 'Este valoarea câmpului „Talie” din fișă. Valorile greutății și înălțimii din fișă dau intervalul concret pentru fiecare rasă.' },
      { question: 'Se potrivesc rasele medii într-un apartament?', answer: 'Depinde de nivelul de energie al rasei. Verifică în fișă nivelul de energie și toleranța la singurătate, nu doar talia.' },
      { question: 'Cum compar două rase medii?', answer: 'Folosește paginile de comparație, unde tabelul vine din fișele celor două rase, sau deschide fișele alăturat.' },
    ],
  },
  {
    slug: 'rase-de-caini-mari',
    group: 'caini',
    title: 'Rase de câini mari',
    metaTitle: 'Rase de câini mari: lista fișelor DiVet',
    metaDesc: 'Rase de câini de talie mare din enciclopedia DiVet: temperament, mișcare, dresaj și îngrijire, cu link spre fișa fiecărei rase.',
    match: (f) => is(f, 'talie', 'Mare'),
    criteria: 'Rasele din fișele DiVet la care câmpul „Talie” este „Mare”.',
    intro: [
      'Câinii de talie mare cer spațiu, hrană pe măsură și timp pentru mișcare și dresaj. Mulți sunt blânzi și răbdători cu familia, dar forța lor face din dresajul timpuriu și din socializare o condiție, nu un bonus.',
      'Lista de mai jos conține rasele mari cu fișă pe DiVet. Fiecare fișă spune cum se comportă rasa, cât de ușor se dresează și ce probleme de sănătate se întâlnesc frecvent, cu surse acolo unde există.',
    ],
    faq: [
      { question: 'Poate trăi un câine mare într-un apartament?', answer: 'Unele rase mari se adaptează dacă primesc mișcare zilnică suficientă. Verifică în fișă nivelul de energie și toleranța la singurătate, nu doar talia.' },
      { question: 'De ce contează dresajul timpuriu la rasele mari?', answer: 'Un câine mare este greu de controlat fără comenzi de bază. Fișele spun cât de ușor se dresează fiecare rasă și ce abordare funcționează.' },
      { question: 'Rasele mari au probleme de sănătate specifice?', answer: 'Unele sunt predispuse la afecțiuni ortopedice sau digestive. Fișele menționează problemele frecvente, iar articolele din secțiunea Sănătate le explică cu surse.' },
    ],
  },
  {
    slug: 'rase-de-caini-pentru-apartament',
    group: 'caini',
    title: 'Rase de câini pentru apartament',
    metaTitle: 'Rase de câini pentru apartament: lista DiVet',
    metaDesc: 'Rase de câini de talie mică sau medie cu nivel de energie scăzut sau mediu, potrivite pentru apartament, din fișele DiVet.',
    match: (f) => is(f, 'talie', 'Mic', 'Mediu') && is(f, 'nivel_energie', 'Foarte scăzut', 'Scăzut', 'Mediu'),
    criteria: 'Rasele din fișele DiVet de talie „Mic” sau „Mediu” și cu nivel de energie „Foarte scăzut”, „Scăzut” sau „Mediu”.',
    intro: [
      'Un câine se descurcă într-un apartament nu doar pentru că este mic, ci pentru că nu are nevoie de ore de alergat și nu se plictisește ușor. De aceea lista combină două criterii din fișe: talia și nivelul de energie.',
      'Nicio rasă nu se potrivește oricărui apartament: zgomotul, programul tău și toleranța la singurătate contează la fel de mult. Fișele spun cât de bine suportă rasa singurătatea și cât de mult latră, acolo unde datele există.',
    ],
    faq: [
      { question: 'Ce criterii folosește lista?', answer: 'Talia „Mic” sau „Mediu” și nivelul de energie „Foarte scăzut”, „Scăzut” sau „Mediu”, așa cum sunt trecute în fișele DiVet.' },
      { question: 'Este suficient un câine cu energie scăzută pentru un apartament?', answer: 'Nu întotdeauna. Are nevoie de plimbări zilnice, iar toleranța la singurătate și zgomotul contează la fel de mult. Verifică-le în fișa rasei.' },
      { question: 'De ce nu apar toate rasele mici?', answer: 'Rasele mici cu energie ridicată nu intră în listă, pentru că se plictisesc și devin zgomotoase într-un spațiu mic fără suficientă mișcare.' },
    ],
  },
  {
    slug: 'cele-mai-inteligente-rase-de-caini',
    group: 'caini',
    title: 'Cele mai inteligente rase de câini',
    metaTitle: 'Cele mai inteligente rase de câini: lista DiVet',
    metaDesc: 'Rase de câini cu ușurință ridicată la dresaj din fișele DiVet: ce înseamnă „inteligent” aici și cum arată dresajul fiecărei rase.',
    match: (f) => is(f, 'usurinta_dresaj', 'Ridicat', 'Foarte ridicat'),
    criteria: 'Rasele din fișele DiVet la care „Ușurința la dresaj” este „Ridicat” sau „Foarte ridicat”.',
    intro: [
      '„Inteligent” are sensuri diferite la câini: cât de repede învață comenzi, cât de bine colaborează cu omul și cât de bine rezolvă probleme. Lista folosește un singur criteriu măsurabil din fișe, ușurința la dresaj, ca să rămână comparabilă.',
      'O rasă care se dresează ușor are nevoie și de ocupație: un câine isteț lăsat fără activitate poate deveni distructiv. Fiecare fișă spune ce nivel de energie are rasa și cât de mult timp cere.',
    ],
    faq: [
      { question: 'Cum se măsoară inteligența câinilor aici?', answer: 'Prin câmpul „Ușurința la dresaj” din fișe, completat pe scala cu cinci trepte folosită pe tot site-ul. Nu este un test standardizat de inteligență.' },
      { question: 'Un câine ușor de dresat este potrivit pentru începători?', answer: 'Ușurința la dresaj ajută, dar rasele isteațe cer și multă ocupație. Verifică în fișă nivelul de energie înainte să alegi.' },
      { question: 'Rasele care lipsesc din listă sunt mai puțin inteligente?', answer: 'Nu neapărat. Lista arată doar rasele cu fișă pe DiVet și cu ușurință ridicată la dresaj; unele rase sunt independente, nu mai puțin capabile.' },
    ],
  },
  {
    slug: 'rase-de-pisici-linistite',
    group: 'pisici',
    title: 'Rase de pisici liniștite',
    metaTitle: 'Rase de pisici liniștite: lista fișelor DiVet',
    metaDesc: 'Rase de pisici cu nivel de energie scăzut sau mediu din fișele DiVet, potrivite pentru case liniștite, cu link spre fișa fiecărei rase.',
    match: (f) => is(f, 'nivel_energie', 'Foarte scăzut', 'Scăzut', 'Mediu'),
    criteria: 'Rasele de pisici din fișele DiVet la care „Nivel de energie” este „Foarte scăzut”, „Scăzut” sau „Mediu”.',
    intro: [
      'Pisicile cu nivel de energie mai scăzut se joacă mai puțin intens și se adaptează mai ușor locuințelor liniștite. Asta nu înseamnă că nu au nevoie de joacă: orice pisică are nevoie de stimulare zilnică.',
      'Lista folosește un singur criteriu din fișe, nivelul de energie. Pentru temperament, îngrijirea blănii și sănătate, deschide fișa fiecărei rase.',
    ],
    faq: [
      { question: 'O pisică liniștită are nevoie de joacă?', answer: 'Da. Nivelul de energie spune cât de intens se joacă, dar orice pisică are nevoie de stimulare zilnică și de un spațiu amenajat pentru ea.' },
      { question: 'Ce criteriu folosește lista?', answer: 'Câmpul „Nivel de energie” din fișele raselor de pisici: „Foarte scăzut”, „Scăzut” sau „Mediu”.' },
      { question: 'Se potrivesc aceste rase familiilor cu copii?', answer: 'Depinde de rasă și de copii. Fișele spun dacă rasa este potrivită pentru copii, acolo unde datele există.' },
    ],
  },
]

export function getList(slug: string): ListDefinition | null {
  return LISTS.find((l) => l.slug === slug) ?? null
}

export type ListPost = { fields: FieldMap }

export type ListAvailability = {
  available: boolean
  /** Motivul pentru care o listă nu se publică. */
  reason: 'ok' | 'too-few' | 'not-selective'
  count: number
  total: number
}

/** Decide dacă o listă se publică, pe baza fișelor grupului. Pură. */
export function listAvailability(def: ListDefinition, groupPosts: ListPost[], min = minEntries()): ListAvailability {
  const total = groupPosts.length
  const count = groupPosts.filter((p) => def.match(p.fields)).length
  if (count < min) return { available: false, reason: 'too-few', count, total }
  if (total > 0 && count / total > MAX_LIST_SHARE) return { available: false, reason: 'not-selective', count, total }
  return { available: true, reason: 'ok', count, total }
}
