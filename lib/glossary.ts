/**
 * Glosar DiVet (/glosar): definitii scurte pentru termeni veterinari si zoologici.
 *
 * Reguli:
 *  - definitie de 20-60 de cuvinte, neutra; fara doze, fara cifre pe care nu le putem sustine;
 *  - `source` DOAR daca pagina a fost deschisa si sustine definitia; fara sursa, termenul ramane un termen general;
 *  - `autolink: true` doar pentru termeni neambigui: la prima aparitie din articol devin link spre /glosar#<slug>
 *    (vezi lib/glossary-autolink.ts); `variants` acopera formele flexionate.
 */

export type GlossaryTerm = {
  slug: string
  term: string
  definition: string
  variants?: string[]
  autolink?: boolean
  source?: { label: string; href: string }
}

const WSAVA = { label: 'WSAVA, Guidelines for the Vaccination of Dogs and Cats (2024)', href: 'https://wsava.org/wp-content/uploads/2024/05/2024-Guidelines-for-the-Vaccination-of-Dogs-and-Cats.pdf' }
const MERCK_CHOC = { label: 'Merck Veterinary Manual: Chocolate toxicity', href: 'https://www.merckvetmanual.com/toxicology/food-hazards/chocolate' }
const MERCK_BLOOD = { label: 'Merck Veterinary Manual: Blood parasites of dogs', href: 'https://www.merckvetmanual.com/dog-owners/blood-disorders-of-dogs/blood-parasites-of-dogs' }
const ANSVSA = { label: 'ANSVSA: sănătatea animalelor de companie', href: 'https://www.ansvsa.ro/sanatate-bunastare-si-nutritie-animala/sanatatea-animalelor/sanatatea-animalelor-de-companie/' }

export const GLOSSARY: readonly GlossaryTerm[] = [
  // ── Sănătate ────────────────────────────────────────────────────────────────
  { slug: 'anticorpi-materni', term: 'Anticorpi materni', variants: ['anticorpii materni', 'anticorpilor materni'], autolink: true, source: WSAVA,
    definition: 'Anticorpi pe care puiul îi primește de la mamă, mai ales prin primul lapte. Protejează puiul în primele săptămâni, dar pot bloca răspunsul la vaccin, de aceea puii primesc mai multe doze.' },
  { slug: 'babesia', term: 'Babesia', source: MERCK_BLOOD,
    definition: 'Grup de paraziți microscopici care infectează globulele roșii ale câinelui și sunt transmiși prin căpușe. Boala provocată se numește babesioză și poate fi ușoară sau foarte gravă.' },
  { slug: 'boala-contagioasa', term: 'Boală contagioasă', variants: ['contagios', 'contagioasă', 'contagioase'],
    definition: 'Boală care se poate transmite de la un animal la altul, direct sau prin obiecte și mediu contaminat. Nu orice boală infecțioasă este contagioasă între animale.' },
  { slug: 'boala-infectioasa', term: 'Boală infecțioasă', variants: ['infecțioasă', 'infecțioase'],
    definition: 'Boală provocată de microorganisme, precum viruși, bacterii sau paraziți. Unele se transmit între animale, altele prin vectori, cum sunt căpușele.' },
  { slug: 'carnet-de-sanatate', term: 'Carnet de sănătate', variants: ['carnetul de sănătate'], source: ANSVSA,
    definition: 'Document în care medicul veterinar trece vaccinările animalului, în special cea antirabică. În România, câinii circulă doar dacă sunt identificați, înregistrați și însoțiți de carnet de sănătate.' },
  { slug: 'deparazitare', term: 'Deparazitare', variants: ['deparazitarea'],
    definition: 'Tratament prin care se elimină sau se previn paraziții interni și externi. Produsul și frecvența le stabilește medicul veterinar, în funcție de animal și de riscul de expunere.' },
  { slug: 'deshidratare', term: 'Deshidratare', variants: ['deshidratarea'],
    definition: 'Pierdere a apei din organism mai mare decât aportul, frecventă după vomă și diaree. La pui și la animalele mici poate deveni gravă repede și cere consult veterinar.' },
  { slug: 'ectoparaziti', term: 'Ectoparaziți', variants: ['ectoparaziții', 'ectoparaziților'], autolink: true,
    definition: 'Paraziți care trăiesc pe pielea sau în blana animalului, de exemplu puricii, căpușele și păduchii. Pot provoca iritații și pot transmite alte boli.' },
  { slug: 'endoparaziti', term: 'Endoparaziți', variants: ['endoparaziții', 'endoparaziților'], autolink: true,
    definition: 'Paraziți care trăiesc în interiorul organismului, de obicei în intestin, cum sunt viermii intestinali. Se previn prin deparazitare internă, stabilită cu medicul veterinar.' },
  { slug: 'metilxantine', term: 'Metilxantine', variants: ['metilxantinele'], autolink: true, source: MERCK_CHOC,
    definition: 'Grup de substanțe din care fac parte teobromina și cafeina, prezente în ciocolată. Pot intoxica câinii; cu cât ciocolata este mai închisă, cu atât conține mai multe.' },
  { slug: 'rapel', term: 'Rapel', variants: ['rapeluri', 'rapelul'], source: WSAVA,
    definition: 'Doză de vaccin dată după seria inițială, pentru a menține protecția. Intervalul dintre rapeluri îl stabilește medicul veterinar, pe baza ghidurilor și a vaccinului folosit.' },
  { slug: 'serologie', term: 'Testare serologică', variants: ['serologie', 'testarea serologică'], source: WSAVA,
    definition: 'Analiză de sânge care măsoară anticorpii. Poate arăta dacă un animal are protecție după vaccinare; decizia de a o face aparține medicului veterinar.' },
  { slug: 'simptom', term: 'Simptom', variants: ['simptome', 'simptomul'],
    definition: 'Semn al unei boli sau al unei probleme de sănătate, de exemplu vomă sau lipsa poftei de mâncare. Un simptom nu este un diagnostic: aceeași manifestare poate avea cauze diferite.' },
  { slug: 'teobromina', term: 'Teobromină', variants: ['teobromina'], autolink: true, source: MERCK_CHOC,
    definition: 'Substanță din cacao, din grupul metilxantinelor, toxică pentru câini. Alături de cafeină, explică de ce ciocolata este periculoasă pentru ei.' },
  { slug: 'toxicitate', term: 'Toxicitate', variants: ['toxic', 'toxică', 'toxice'],
    definition: 'Capacitatea unei substanțe de a face rău organismului. Depinde de specie, de cantitate și de greutatea animalului, de aceea articolele noastre nu dau cantități „sigure”.' },
  { slug: 'vaccin-core', term: 'Vaccin core', variants: ['vaccinuri core', 'vaccinurile core'], autolink: true, source: WSAVA,
    definition: 'Vaccin recomandat tuturor animalelor de o specie, indiferent de stilul de viață, pentru boli grave și răspândite. Pentru câini, ghidul WSAVA include ciuma, adenovirusul și parvovirusul.' },
  { slug: 'vaccin-non-core', term: 'Vaccin non-core', variants: ['vaccinuri non-core', 'vaccinurile non-core'], autolink: true, source: WSAVA,
    definition: 'Vaccin recomandat doar unor animale, în funcție de zonă, stil de viață și risc de expunere. Decizia se ia împreună cu medicul veterinar.' },
  { slug: 'vector', term: 'Vector', variants: ['vectori', 'vectorul'],
    definition: 'Animal care transmite un agent al bolii de la un gazdă la alta fără să fie, de obicei, bolnav el însuși. Căpușele sunt vectori pentru mai multe boli ale câinilor.' },
  { slug: 'zoonoza', term: 'Zoonoză', variants: ['zoonoze', 'zoonozei', 'zoonozele'], autolink: true,
    definition: 'Boală care se poate transmite între animale și oameni. Unele boli ale câinilor și ale pisicilor sunt zoonoze, altele nu; articolele spun asta doar când sursele sunt clare.' },

  // ── Rase și îngrijire ───────────────────────────────────────────────────────
  { slug: 'brahicefalic', term: 'Brahicefalic', variants: ['brahicefalice', 'brahicefali'], autolink: true,
    definition: 'Despre rasele cu botul foarte scurt, ca bulldogul francez sau pisica persană. Anatomia lor poate îngreuna respirația, mai ales pe căldură sau la efort.' },
  { slug: 'talie', term: 'Talie', variants: ['talia'],
    definition: 'În fișele DiVet, categoria de mărime a rasei: mică, medie sau mare. Greutatea și înălțimea din fișă dau intervalul concret pentru fiecare rasă.' },

  // ── Zoologie ────────────────────────────────────────────────────────────────
  { slug: 'bioluminescenta', term: 'Bioluminescență', variants: ['bioluminescența', 'bioluminescent', 'bioluminescente'], autolink: true,
    definition: 'Capacitatea unor organisme de a produce lumină proprie, printr-o reacție chimică. O întâlnim la licurici, la unele meduze și la mulți pești de adâncime.' },
  { slug: 'camuflaj', term: 'Camuflaj', variants: ['camuflajul'],
    definition: 'Adaptare prin care un animal se confundă cu mediul ca să evite prădătorii sau să-și surprindă prada, prin culoare, formă sau comportament.' },
  { slug: 'carnivor', term: 'Carnivor', variants: ['carnivore', 'carnivori'],
    definition: 'Animal care se hrănește în principal cu carne. Termenul descrie dieta, nu grupul sistematic: unele carnivore mănâncă și plante.' },
  { slug: 'cetacee', term: 'Cetacee', variants: ['cetaceele'],
    definition: 'Grupul mamiferelor marine din care fac parte balenele, delfinii și marsuinii. Respiră aer, nasc pui vii și își alăptează puii.' },
  { slug: 'endemic', term: 'Endemic', variants: ['endemică', 'endemice', 'endemism'], autolink: true,
    definition: 'Despre o specie care trăiește natural doar într-o anumită zonă și nu se găsește în altă parte.' },
  { slug: 'erbivor', term: 'Erbivor', variants: ['erbivore', 'erbivori'],
    definition: 'Animal care se hrănește în principal cu plante, de exemplu ierburi, frunze sau fructe.' },
  { slug: 'habitat', term: 'Habitat', variants: ['habitatul'],
    definition: 'Mediul în care trăiește în mod natural o specie și care îi oferă hrană, adăpost și condiții pentru reproducere.' },
  { slug: 'hibernare', term: 'Hibernare', variants: ['hibernarea', 'hibernează', 'hiberna'], autolink: true,
    definition: 'Stare de activitate foarte redusă în sezonul rece, în care animalul își încetinește metabolismul și consumă rezervele de grăsime. Nu este același lucru cu somnul obișnuit.' },
  { slug: 'migratie', term: 'Migrație', variants: ['migrația', 'migrează', 'migratoare'],
    definition: 'Deplasarea periodică a animalelor între zone, de obicei după hrană sau pentru reproducere, la anumite momente ale anului.' },
  { slug: 'nevertebrate', term: 'Nevertebrate', variants: ['nevertebratele'],
    definition: 'Animale fără coloană vertebrală, de exemplu insectele, moluștele și echinodermele. Reprezintă marea majoritate a speciilor de animale.' },
  { slug: 'omnivor', term: 'Omnivor', variants: ['omnivore', 'omnivori'],
    definition: 'Animal care se hrănește atât cu plante, cât și cu carne, în funcție de ce găsește în mediu.' },
  { slug: 'pradator', term: 'Prădător', variants: ['prădători', 'prădătorul'],
    definition: 'Animal care vânează alte animale, numite pradă, ca să se hrănească. Același animal poate fi prădător pentru unele specii și pradă pentru altele.' },
]

export function glossaryAnchor(t: Pick<GlossaryTerm, 'slug'>): string {
  return `/glosar#${t.slug}`
}

/** Termenii in ordine alfabetica romaneasca, pentru pagina /glosar. */
export function sortedGlossary(terms: readonly GlossaryTerm[] = GLOSSARY): GlossaryTerm[] {
  return [...terms].sort((a, b) => a.term.localeCompare(b.term, 'ro'))
}

/** Litera de grupare a unui termen (fara diacritice, majuscula). */
export function initialOf(term: string): string {
  const first = term.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().charAt(0).toUpperCase()
  return /[A-Z]/.test(first) ? first : '#'
}
