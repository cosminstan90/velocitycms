/**
 * Liste filtrate „Rase de ... " (/liste/<slug>), generate din câmpurile fișelor.
 *
 * O listă se publică DOAR dacă filtrul este util:
 *  - are cel puțin MIN_LIST_ENTRIES intrări (altfel ar fi pagină subțire);
 *  - nu conține aproape toate fișele grupului (un filtru care le include pe toate nu filtrează nimic).
 * Textele editoriale (intro + FAQ) sunt scrise aici, nu generate.
 *
 * Listele „Rase asemănătoare cu X" (`curated`) nu filtrează după câmpuri: membrii sunt aleși de redacție, în ordine,
 * fiecare cu o notă despre diferența care contează. Se publică doar cu cel puțin CURATED_MIN_ENTRIES fișe PUBLICATE
 * dintre cele alese (fișele încă neprogramate sau în draft nu apar și nu sunt linkate).
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
  /** Membri aleși manual (liste „Rase asemănătoare cu X"); când există, `match` nu se folosește. */
  curated?: readonly CuratedEntry[]
  /** Fișa rasei de referință („X"), afișată ca link. Doar pentru fișe deja publicate. */
  subject?: { name: string; href: string }
  /** Surse externe pentru afirmațiile din intro/FAQ care nu vin din fișe. */
  sources?: ReadonlyArray<{ label: string; href: string }>
}

export type CuratedEntry = { slug: string; note: string }

export type FieldMap = Record<string, string | undefined>

export const MIN_LIST_ENTRIES = 8
/** Pragul pentru listele alese manual: cel puțin atâtea fișe publicate. */
export const CURATED_MIN_ENTRIES = 3
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
    metaTitle: 'Rase de câini mici: listă cu fișe de rasă',
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
    metaTitle: 'Rase de câini de talie medie: listă cu fișe',
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
    metaTitle: 'Rase de câini mari: listă cu fișe de rasă',
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
    metaTitle: 'Rase de câini pentru apartament: listă cu fișe',
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
    metaTitle: 'Cele mai inteligente rase de câini: listă cu fișe',
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
    metaTitle: 'Rase de pisici liniștite: listă cu fișe de rasă',
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
  // ── „Rase asemănătoare cu X": membri aleși manual; notele vin din fișele DiVet ─────────────────────────
  {
    slug: 'rase-asemanatoare-cu-labrador',
    group: 'caini',
    title: 'Rase asemănătoare cu Labradorul',
    metaTitle: 'Rase asemănătoare cu Labradorul: alternative',
    metaDesc: 'Rase asemănătoare cu Labradorul: Golden Retriever, Vizsla, Pointer englez și Setter irlandez. Ce au în comun și unde diferă de Labrador.',
    match: () => false,
    criteria: 'Rase alese de redacție după talie, nivel de energie, ușurința la dresaj și compatibilitatea cu copiii, din fișele DiVet.',
    subject: { name: 'Labrador Retriever', href: '/caini/rase/labrador-rasa-caini-caracteristici' },
    intro: [
      'Labradorul este o rasă mare, prietenoasă și foarte ușor de dresat, bună cu copiii și dornică de mișcare zilnică. Rasele de mai jos seamănă cu el prin talie, energie și rol: sunt câini de vânătoare crescuți să lucreze alături de om.',
      'Nicio rasă nu îl înlocuiește perfect. Pentru fiecare am notat diferența care contează pentru stăpân, din fișele DiVet. Detaliile complete sunt în fișa fiecărei rase.',
    ],
    curated: [
      { slug: 'golden-retriever-caracteristici-temperament', note: 'Cea mai apropiată alternativă: tot retriever britanic, blând și foarte ușor de dresat. Blana cere însă mai mult periaj, iar cancerul este principala problemă de sănătate a rasei.' },
      { slug: 'vizsla', note: 'Câine maghiar de aret, de talie medie, cu blană scurtă ușor de îngrijit. Are energie foarte ridicată și se atașează mult de stăpân, deci suportă greu singurătatea.' },
      { slug: 'pointer-englez', note: 'Rasă britanică de aret, atletică, cu blană scurtă și îngrijire minimă. Are energie foarte ridicată și este ușor reținută cu străinii, spre deosebire de Labradorul deschis cu toată lumea.' },
      { slug: 'setter-irlandez', note: 'Câine de aret irlandez, afectuos și jucăuș, cu blană lungă roșu-castaniu care cere periaj. Are nevoie de cel puțin două ore de mișcare pe zi și se dresează mai greu decât Labradorul.' },
    ],
    faq: [
      { question: 'Care rasă seamănă cel mai mult cu Labradorul?', answer: 'Golden Retrieverul. Ambele sunt retrievere britanice, mari, blânde și foarte ușor de dresat. Diferă mai ales prin blană: Golden Retrieverul are păr mai lung și cere mai mult periaj.' },
      { question: 'Există o rasă ca Labradorul, dar cu blană mai ușor de îngrijit?', answer: 'Vizsla și Pointerul englez au blană scurtă, cu îngrijire scăzută. Ambele au însă energie foarte ridicată, mai mare decât a Labradorului.' },
      { question: 'Sunt alternativele la Labrador bune cu copiii?', answer: 'Toate cele patru rase din listă sunt notate în fișele DiVet ca bune cu copiii. Un câine mare și energic are totuși nevoie de supraveghere lângă copiii mici.' },
      { question: 'Cât trăiesc rasele asemănătoare cu Labradorul?', answer: 'Labradorul și Golden Retrieverul trăiesc 10–12 ani. Vizsla trăiește 12–14 ani, iar Pointerul englez și Setterul irlandez 12–15 ani, după fișele raselor.' },
      { question: 'Pot ține una dintre aceste rase la apartament?', answer: 'Doar cu mișcare zilnică serioasă. Toate au energie ridicată sau foarte ridicată și suportă greu singurătatea, deci timpul petrecut cu câinele contează mai mult decât spațiul.' },
    ],
  },
  {
    slug: 'rase-asemanatoare-cu-cane-corso',
    group: 'caini',
    title: 'Rase de câini asemănătoare cu Cane Corso',
    metaTitle: 'Rase asemănătoare cu Cane Corso: alternative',
    metaDesc: 'Rase de câini asemănătoare cu Cane Corso: Rottweiler, Dog de Bordeaux, Alabai și ciobăneștii de pază. Ce au în comun și ce cere legea din România.',
    match: () => false,
    criteria: 'Rase alese de redacție după talie, rolul de pază și temperament, din fișele DiVet.',
    intro: [
      'Cane Corso este un molosoid italian de pază. Standardul FCI cere la masculi 64–68 cm și 45–50 kg. PDSA îi recomandă circa două ore de mișcare pe zi și indică o speranță medie de viață sub 10 ani.',
      'Rasele de mai jos seamănă cu el prin talie și rol: sunt câini mari de pază, protectori și rezervați cu străinii. Toate cer socializare timpurie și un proprietar cu experiență.',
      'Atenție la lege: în România, Cane Corso, Rottweilerul și Ciobănescul Caucazian sunt în categoria a II-a de câini periculoși din OUG 55/2002. Deținerea este permisă, cu înregistrare, botniță și lesă în locurile publice.',
    ],
    curated: [
      { slug: 'rottweiler', note: 'Cel mai apropiat ca energie și dresaj: câine german de pază, bun la fire și ușor de dresat, cu blană scurtă. Ca și Cane Corso, este în categoria a II-a din OUG 55/2002 și trăiește de obicei sub 10 ani.' },
      { slug: 'dog-de-bordeaux', note: 'Molosoid francez masiv, de 50–68 kg, calm și protector, cu blană scurtă ușor de îngrijit. Are energie scăzută și o speranță de viață scurtă, de 5–10 ani.' },
      { slug: 'alabai', note: 'Ciobănesc de Asia Centrală, foarte mare, calm în familie și suspicios cu străinii. Este mai independent decât Cane Corso, cere mult spațiu și trăiește 10–14 ani.' },
      { slug: 'ciobanesc-caucazian', note: 'Câine de pază foarte mare din Caucaz, curajos și loial familiei. Este în categoria a II-a din OUG 55/2002, ca Cane Corso, iar blana cere mai multă îngrijire.' },
      { slug: 'ciobanesc-anatolian', note: 'Câine turcesc de pază, de 36–66 kg, independent și rezervat cu străinii. Nu figurează în lista din OUG 55/2002, dar cere același tip de proprietar cu experiență.' },
    ],
    faq: [
      { question: 'Ce rasă seamănă cel mai mult cu Cane Corso?', answer: 'Rottweilerul, ca energie, dresaj și rol de pază. Ambii sunt molosoizi mari, protectori, cu blană scurtă, și sunt în categoria a II-a de câini periculoși în România.' },
      { question: 'Este Cane Corso câine periculos în România?', answer: 'Da. OUG 55/2002 include Cane Corso și metișii lui în categoria a II-a. Deținerea este permisă, cu înregistrare, declarație la poliție, botniță și lesă în locurile publice.' },
      { question: 'Care alternative la Cane Corso nu sunt în lista câinilor periculoși?', answer: 'Dintre rasele din listă, Dog de Bordeaux, Alabai și Ciobănescul Anatolian nu figurează în OUG 55/2002. Toate rămân câini mari de pază, care cer experiență și socializare.' },
      { question: 'Cât trăiește Cane Corso față de alternative?', answer: 'PDSA indică pentru Cane Corso o speranță medie de viață sub 10 ani. Dog de Bordeaux trăiește 5–10 ani, iar ciobăneștii de pază din listă 10–14 ani, după fișele DiVet.' },
      { question: 'Sunt aceste rase potrivite pentru un începător?', answer: 'De regulă, nu. Fișele DiVet recomandă pentru toate un proprietar cu experiență, socializare timpurie și spațiu. Sunt câini puternici, protectori și uneori independenți.' },
    ],
    sources: [
      { label: 'FCI, standardul nr. 343: Cane Corso Italiano', href: 'https://www.fci.be/Nomenclature/Standards/343g02-en.pdf' },
      { label: 'PDSA: Cane Corso', href: 'https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/puppies-dogs/large-dogs/cane-corso' },
      { label: 'OUG nr. 55/2002 privind regimul de deținere a câinilor periculoși sau agresivi', href: 'https://legeaz.net/text-integral/oug-55-2002-regim-detinere-caini-periculosi-agresivi' },
    ],
  },
  {
    slug: 'rase-asemanatoare-cu-bichon',
    group: 'caini',
    title: 'Rase de câini asemănătoare cu Bichonul',
    metaTitle: 'Rase asemănătoare cu Bichon Frise: alternative',
    metaDesc: 'Rase de câini asemănătoare cu Bichonul: Bichon maltez, Coton de Tulear și Lagotto Romagnolo. Talie, blană, îngrijire și temperament, pe scurt.',
    match: () => false,
    criteria: 'Rase alese de redacție după talie, tipul blănii și temperament, din fișele DiVet.',
    subject: { name: 'Bichon Frise', href: '/caini/rase/bichon-frise-rasa-caini-caracteristici' },
    intro: [
      'Bichon Frise este un câine mic de companie, cu blană albă, creață, care cere periaj zilnic. Este jucăuș și afectuos, se adaptează bine la apartament, dar nu suportă singurătatea.',
      'Rasele de mai jos seamănă cu el prin talie, blană sau temperament. Două sunt tot câini mici, albi, de companie. Lagotto Romagnolo are blană creață asemănătoare, dar este un câine de lucru, mai mare.',
    ],
    curated: [
      { slug: 'bichon-maltez', note: 'Câine toy de 3–4 kg, cu blană lungă, albă și mătăsoasă, nu creață. Este vioi, afectuos și se dresează ușor, dar cere periaj zilnic și atenție pentru dinți.' },
      { slug: 'coton-de-tulear', note: 'Câine mic din Madagascar, de 3,5–6 kg, cu blană albă ca bumbacul. Este vesel și sociabil și cere periaj zilnic și compania oamenilor, ca Bichonul.' },
      { slug: 'lagotto-romagnolo', note: 'Câine italian de talie medie, de 11–16 kg, cu blană în bucle lânoase care se tunde regulat. Trăiește 15–17 ani, dar are energie ridicată și cere mult mai multă mișcare decât Bichonul.' },
    ],
    faq: [
      { question: 'Care este diferența dintre Bichon Frise și Bichonul maltez?', answer: 'Blana și talia. Bichon Frise are 5–8 kg și blană albă, creață și pufoasă. Bichonul maltez are 3–4 kg și blană lungă, albă și mătăsoasă. Ambele cer periaj zilnic.' },
      { question: 'Ce rasă seamănă cu Bichonul, dar este mai mare?', answer: 'Lagotto Romagnolo are blană creață asemănătoare, dar cântărește 11–16 kg și are energie ridicată. Este un câine de lucru, crescut pentru recuperare din apă și căutat trufe.' },
      { question: 'Care alternative la Bichon se potrivesc la apartament?', answer: 'Bichonul maltez și Coton de Tulear sunt câini mici de companie, potriviți pentru apartament. Ca și Bichon Frise, suportă greu singurătatea.' },
      { question: 'Cât timp cere îngrijirea blănii?', answer: 'Mult, la toate. Fișele DiVet notează îngrijirea blănii ca ridicată sau foarte ridicată. Bichonul, maltezul și Coton de Tulear cer periaj zilnic, iar Lagotto se tunde regulat.' },
      { question: 'Cât trăiesc rasele asemănătoare cu Bichonul?', answer: 'Bichon Frise trăiește 12–15 ani. Bichonul maltez și Coton de Tulear trăiesc peste 12 ani, iar Lagotto Romagnolo 15–17 ani, după fișele raselor.' },
    ],
  },
]

export function getList(slug: string): ListDefinition | null {
  return LISTS.find((l) => l.slug === slug) ?? null
}

export type ListPost = { slug?: string; fields: FieldMap }

/** True dacă fișa intră în listă: după slug la listele alese manual, după câmpuri la celelalte. */
export function listMatches(def: ListDefinition, p: ListPost): boolean {
  if (def.curated) return !!p.slug && def.curated.some((c) => c.slug === p.slug)
  return def.match(p.fields)
}

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
  const count = groupPosts.filter((p) => listMatches(def, p)).length
  if (def.curated) {
    // O listă aleasă manual nu are pragul de selectivitate: are mereu puțini membri, aleși de redacție.
    return count >= CURATED_MIN_ENTRIES
      ? { available: true, reason: 'ok', count, total }
      : { available: false, reason: 'too-few', count, total }
  }
  if (count < min) return { available: false, reason: 'too-few', count, total }
  if (total > 0 && count / total > MAX_LIST_SHARE) return { available: false, reason: 'not-selective', count, total }
  return { available: true, reason: 'ok', count, total }
}
