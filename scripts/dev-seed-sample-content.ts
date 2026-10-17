/**
 * LOCAL-ONLY sample content seed (DiVet frontend verification).
 *
 * Refuses to run unless DATABASE_URL points at 127.0.0.1 or localhost.
 * Idempotent: posts are upserted by (siteId, slug); FieldValue rows are
 * synced to exactly what is defined here.
 *
 * Run:
 *   node --env-file=.env node_modules/ts-node/dist/bin.js \
 *     --compiler-options '{"module":"CommonJS"}' scripts/dev-seed-sample-content.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// ── Safety guard (must stay first; runs before any connection) ──────────────
function assertLocalDatabase(): string {
  const raw = process.env.DATABASE_URL
  if (!raw) {
    console.error('ABORT: DATABASE_URL is not set.')
    process.exit(1)
  }
  let host = ''
  try {
    host = new URL(raw).hostname
  } catch {
    console.error('ABORT: DATABASE_URL cannot be parsed.')
    process.exit(1)
  }
  if (host !== '127.0.0.1' && host !== 'localhost') {
    console.error(
      `ABORT: this script only runs against a local database (127.0.0.1 or localhost). Refusing host "${host}".`
    )
    process.exit(1)
  }
  return raw
}

const databaseUrl = assertLocalDatabase()
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) })

// ── Types & helpers ─────────────────────────────────────────────────────────
interface Section { h: string; ps: string[] }
interface Faq { question: string; answer: string }
interface SamplePost {
  slug: string
  title: string
  category: string // 'parent/child' or 'parent'
  excerpt: string
  metaTitle: string
  metaDescription: string
  sections: Section[]
  faq?: Faq[]
  fields: Record<string, string>
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function buildJson(p: SamplePost) {
  const content: unknown[] = []
  for (const s of p.sections) {
    content.push({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: s.h }] })
    for (const t of s.ps) content.push({ type: 'paragraph', content: [{ type: 'text', text: t }] })
  }
  // Same shape the publisher appends (app/api/publisher/receive/route.ts)
  if (p.faq?.length) content.push({ type: 'faqBlock', attrs: { items: p.faq } })
  return { type: 'doc', content }
}

// HTML as editor.getHTML() serialises FAQBlock.renderHTML (ProseMirror DOMSerializer:
// every attribute, including the spec's `innerHTML`, is set with setAttribute).
function faqHtml(items: Faq[]): string {
  const inner = items
    .map(
      (item) =>
        `<div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">` +
        `<h3 itemprop="name">${item.question}</h3>` +
        `<div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">` +
        `<p itemprop="text">${item.answer}</p></div></div>`
    )
    .join('')
  return (
    `<div data-items="${esc(JSON.stringify(items))}" data-type="faq-block" data-faq="true" ` +
    `itemscope="" itemtype="https://schema.org/FAQPage" class="faq-block">` +
    `<div innerhtml="${esc(inner)}"></div></div>`
  )
}

function buildHtml(p: SamplePost): string {
  let html = p.sections
    .map((s) => `<h2>${esc(s.h)}</h2>` + s.ps.map((t) => `<p>${esc(t)}</p>`).join(''))
    .join('')
  if (p.faq?.length) html += faqHtml(p.faq)
  return html
}

// ── Sample content ──────────────────────────────────────────────────────────
const POSTS: SamplePost[] = [
  {
    slug: 'labrador-retriever',
    title: 'Labrador Retriever',
    category: 'caini/rase',
    excerpt: 'Labradorul este una dintre cele mai răspândite rase de companie: blând, ușor de dresat și foarte atașat de familie.',
    metaTitle: 'Labrador Retriever: caracter, îngrijire și sănătate',
    metaDescription: 'Fișa rasei Labrador Retriever: origine, talie, temperament, nevoi de mișcare, îngrijire și întrebări frecvente pentru viitorii stăpâni.',
    fields: {
      tldr: 'Labradorul este un câine de talie mare, blând și foarte ușor de dresat. Are nevoie de mișcare zilnică și de o alimentație controlată, pentru că tinde să se îngrașe. Se potrivește bine familiilor cu copii, dar nu suportă bine singurătatea.',
      origine: 'Regatul Unit',
      talie: 'Mare',
      greutate: '25–36 kg',
      inaltime: '55–62 cm',
      speranta_viata: '10–12 ani',
      temperament: 'Blând, inteligent, jucăuș, loial',
      nivel_energie: 'Ridicat',
      ingrijire_blana: 'Mediu',
      usurinta_dresaj: 'Foarte ridicat',
      toleranta_singuratate: 'Scăzut',
      bun_cu_copiii: 'Da',
    },
    sections: [
      {
        h: 'Origine și istoric',
        ps: [
          'Rasa a fost dezvoltată în Regatul Unit, pornind de la câinii de lucru folosiți de pescari în Newfoundland pentru a aduce plasele și peștii scăpați din apă.',
          'Astăzi este crescut în principal ca animal de companie, dar și ca ghid pentru persoane cu deficiențe de vedere sau câine de asistență.',
        ],
      },
      {
        h: 'Temperament și dresaj',
        ps: [
          'Labradorul este prietenos, răbdător și dornic să colaboreze, iar aceste calități îl fac potrivit și pentru stăpânii la prima experiență.',
          'Dresajul prin recompense funcționează foarte bine. Fiind un câine sociabil, are nevoie de compania oamenilor și poate deveni distructiv dacă este lăsat mult timp singur.',
        ],
      },
      {
        h: 'Mișcare și alimentație',
        ps: [
          'Are nevoie de plimbări zilnice și de activități în care să-și folosească energia, cum ar fi aducerea obiectelor sau înotul.',
          'Rasa are tendința să se îngrașe ușor, așa că porțiile se măsoară, iar recompensele se includ în totalul zilnic de hrană.',
        ],
      },
      {
        h: 'Îngrijirea blănii',
        ps: [
          'Blana scurtă și densă năpârlește pe tot parcursul anului, mai intens primăvara și toamna. Periajul de câteva ori pe săptămână ajută la menținerea unei case mai curate.',
        ],
      },
    ],
    faq: [
      { question: 'Este Labradorul un câine bun pentru familiile cu copii?', answer: 'Da, în general este blând și răbdător cu copiii. Interacțiunile cu copiii mici trebuie totuși supravegheate, pentru că un câine de talie mare poate dărâma un copil din entuziasm.' },
      { question: 'Cât de multă mișcare are nevoie zilnic un Labrador adult?', answer: 'De regulă cel puțin una până la două ore de activitate pe zi, împărțite între plimbări și joacă.' },
      { question: 'De ce se îngrașă atât de ușor Labradorul?', answer: 'Rasa are un apetit foarte mare și mulți indivizi mănâncă tot ce li se oferă. Porțiile măsurate și mișcarea regulată previn excesul de greutate.' },
    ],
  },
  {
    slug: 'ciobanesc-german',
    title: 'Ciobănesc German',
    category: 'caini/rase',
    excerpt: 'Ciobănescul german este un câine de lucru versatil, inteligent și loial, folosit în poliție, căutare-salvare și ca însoțitor de familie.',
    metaTitle: 'Ciobănesc German: caracter, dresaj și îngrijire',
    metaDescription: 'Tot ce trebuie să știi despre Ciobănescul German: origine, talie, temperament, nevoie de activitate, dresaj și îngrijirea blănii.',
    fields: {
      tldr: 'Ciobănescul german este un câine de talie mare, foarte inteligent și loial. Are nevoie de activitate fizică și mentală zilnică și de un dresaj consecvent încă de pui.',
      origine: 'Germania',
      talie: 'Mare',
      greutate: '22–40 kg',
      inaltime: '55–65 cm',
      speranta_viata: '9–13 ani',
      temperament: 'Loial, curajos, inteligent, protector',
      nivel_energie: 'Foarte ridicat',
      ingrijire_blana: 'Ridicat',
      usurinta_dresaj: 'Foarte ridicat',
    },
    sections: [
      {
        h: 'Origine',
        ps: ['Rasa a fost standardizată la sfârșitul secolului al XIX-lea în Germania, pornind de la câini de păstorit. Scopul era un câine de lucru rezistent și ușor de instruit.'],
      },
      {
        h: 'Caracter și dresaj',
        ps: [
          'Este un câine atent, devotat familiei și rezervat cu străinii. Socializarea timpurie cu oameni, animale și locuri noi este importantă.',
          'Învață rapid și are nevoie de sarcini. Fără activitate suficientă, se poate plictisi și poate dezvolta comportamente nedorite.',
        ],
      },
      {
        h: 'Îngrijire și sănătate',
        ps: [
          'Năpârlește abundent, iar periajul regulat este necesar, mai ales în perioadele de năpârlire.',
          'Ca multe rase mari, poate fi predispus la probleme articulare, de aceea merită controale veterinare periodice și o greutate corporală menținută în limite normale.',
        ],
      },
    ],
  },
  {
    slug: 'bichon-maltez',
    title: 'Bichon Maltez',
    category: 'caini/rase',
    excerpt: 'Bichonul maltez este un câine de talie mică, cu blană lungă și albă, foarte atașat de stăpân.',
    metaTitle: 'Bichon Maltez: fișa rasei și sfaturi de îngrijire',
    metaDescription: 'Bichonul maltez este un câine mic de companie, afectuos și vioi. Află despre origine, greutate, speranță de viață și nevoi de îngrijire.',
    fields: {
      tldr: 'Bichonul maltez este un câine mic de companie, afectuos și atașat de familie. Blana lungă și albă cere îngrijire constantă.',
      origine: 'Malta',
      talie: 'Mic',
      greutate: '3–4 kg',
      speranta_viata: '12–15 ani',
    },
    sections: [
      {
        h: 'Prezentare generală',
        ps: ['Bichonul maltez este una dintre cele mai vechi rase de companie din bazinul mediteranean. Are blană lungă, mătăsoasă, de obicei complet albă.'],
      },
      {
        h: 'Temperament',
        ps: ['Este vioi, jucăuș și foarte atașat de oameni. Se adaptează bine la apartament, dar nu îi place să fie lăsat singur multe ore.'],
      },
      {
        h: 'Îngrijirea blănii',
        ps: ['Blana se piaptănă zilnic sau la două zile pentru a preveni încâlcirea. Baia și tunsul periodic sunt de obicei necesare, iar zona ochilor se curăță regulat.'],
      },
    ],
  },
  {
    slug: 'maine-coon',
    title: 'Maine Coon',
    category: 'pisici/rase',
    excerpt: 'Maine Coon este una dintre cele mai mari rase de pisici domestice, cunoscută pentru blana deasă și caracterul blând.',
    metaTitle: 'Maine Coon: pisica uriașă cu caracter blând',
    metaDescription: 'Maine Coon: origine, dimensiuni, caracter, îngrijirea blănii lungi și sfaturi pentru viitorii proprietari ai acestei rase de pisici.',
    fields: {
      tldr: 'Maine Coon este o pisică de talie mare, cu blană lungă și caracter blând. Are nevoie de periaj regulat și de spațiu pentru joacă.',
      origine: 'Statele Unite ale Americii',
      talie: 'Mare',
      greutate: '4–8 kg',
      speranta_viata: '12–15 ani',
      temperament: 'Blând, sociabil, jucăuș',
      ingrijire_blana: 'Ridicat',
      bun_cu_copiii: 'Da',
    },
    sections: [
      {
        h: 'Origine',
        ps: ['Rasa provine din statul Maine din Statele Unite ale Americii și este considerată una dintre cele mai vechi rase native ale continentului.'],
      },
      {
        h: 'Aspect și caracter',
        ps: [
          'Are corp masiv, urechi cu smocuri de păr și o coadă lungă și stufoasă. Masculii adulți sunt vizibil mai mari decât femelele.',
          'În ciuda dimensiunilor, este o pisică prietenoasă, care își urmărește de obicei familia prin casă.',
        ],
      },
      {
        h: 'Îngrijire',
        ps: ['Blana lungă se periază de câteva ori pe săptămână pentru a evita nodurile. Hrana trebuie adaptată vârstei și greutății, iar controalele veterinare periodice sunt recomandate.'],
      },
    ],
  },
  {
    slug: 'pisica-persana',
    title: 'Pisică Persană',
    category: 'pisici/rase',
    excerpt: 'Pisica persană se remarcă prin blana lungă, fața rotundă și temperamentul liniștit.',
    metaTitle: 'Pisica Persană: fișa rasei și îngrijirea blănii',
    metaDescription: 'Pisica persană este o rasă veche de companie, cu blană lungă și caracter calm. Află ce implică îngrijirea ei de zi cu zi.',
    fields: {
      tldr: 'Pisica persană este calmă și afectuoasă, cu blană lungă care cere îngrijire zilnică.',
      origine: 'Persia (Iran)',
    },
    sections: [
      {
        h: 'Prezentare',
        ps: ['Persana este o rasă de pisici de apartament, apreciată pentru blana abundentă și pentru atitudinea liniștită.'],
      },
      {
        h: 'Îngrijirea blănii și a ochilor',
        ps: ['Blana se piaptănă zilnic. Fața turtită poate favoriza lăcrimarea, așa că zona ochilor se curăță cu grijă, conform recomandărilor medicului veterinar.'],
      },
      {
        h: 'Mediul potrivit',
        ps: ['Preferă un mediu calm și previzibil. Este o pisică de interior, iar jocul blând și rutina zilnică îi fac bine.'],
      },
    ],
  },
  {
    slug: 'papagal-cenusiu',
    title: 'Papagal Cenușiu',
    category: 'pasari/papagali',
    excerpt: 'Papagalul cenușiu african este recunoscut pentru inteligența și capacitatea de a imita sunete și cuvinte.',
    metaTitle: 'Papagalul Cenușiu: habitat, hrană și longevitate',
    metaDescription: 'Papagalul cenușiu african: unde trăiește, cu ce se hrănește, cât trăiește și de ce este considerat o specie amenințată.',
    fields: {
      habitat: 'Păduri tropicale din Africa Centrală și de Vest',
      dieta: 'Semințe, fructe, nuci și frunze',
      speranta_viata: '40–60 ani',
      statut_conservare: 'EN',
    },
    sections: [
      {
        h: 'Unde trăiește',
        ps: ['În natură, papagalul cenușiu trăiește în pădurile umede din Africa Centrală și de Vest, de obicei în stoluri.'],
      },
      {
        h: 'Hrană',
        ps: ['Se hrănește cu semințe, fructe, nuci și frunze. În captivitate, hrana trebuie să fie variată și să includă legume și fructe proaspete, nu doar semințe.'],
      },
      {
        h: 'Statut de conservare',
        ps: ['Specia este considerată în pericol din cauza pierderii habitatului și a capturării pentru comerț. Cumpărarea unei păsări presupune verificarea provenienței legale.'],
      },
    ],
  },
  {
    slug: 'pestele-betta',
    title: 'Peștele Betta',
    category: 'acvariu-terariu/pesti-apa-dulce',
    excerpt: 'Peștele Betta este un pește de acvariu colorat, cu aripioare lungi, ușor de recunoscut.',
    metaTitle: 'Peștele Betta: acvariu, hrană și comportament',
    metaDescription: 'Peștele Betta (Betta splendens): de unde provine, ce dimensiuni atinge, cu ce se hrănește și ce condiții are nevoie într-un acvariu.',
    fields: {
      habitat: 'Ape line și orezării din Asia de Sud-Est',
      lungime_max: '6–7 cm',
      dieta: 'Insectivor; hrană vie, congelată sau granule',
      statut_conservare: 'VU',
    },
    sections: [
      {
        h: 'Origine și aspect',
        ps: ['Betta splendens provine din ape stagnante sau cu curent slab din Asia de Sud-Est. Masculii au aripioare lungi și culori intense.'],
      },
      {
        h: 'Cerințe de acvariu',
        ps: [
          'Are nevoie de un acvariu cu apă caldă și stabilă, filtrată blând și cu locuri de ascunzătoare din plante.',
          'Masculii sunt teritoriali față de alți masculi, de aceea nu se țin împreună.',
        ],
      },
      {
        h: 'Hrană',
        ps: ['Este în principal insectivor. Hrana potrivită include granule pentru Betta, larve de țânțar congelate sau alte hrane adaptate speciei, în cantități mici.'],
      },
    ],
  },
  {
    slug: 'bufnita-de-zapada',
    title: 'Bufniță de Zăpadă',
    category: 'salbatice/rapitoare',
    excerpt: 'Bufnița de zăpadă este o pasăre răpitoare din regiunile arctice, cu penaj alb, care vânează adesea ziua.',
    metaTitle: 'Bufnița de Zăpadă: habitat, hrană și anvergură',
    metaDescription: 'Bufnița de zăpadă: unde trăiește, cu ce se hrănește, ce anvergură are și care este statutul ei de conservare.',
    fields: {
      anvergura: '125–150 cm',
      habitat: 'Tundra arctică',
      dieta: 'Lemingi, rozătoare mici și păsări',
      speranta_viata: '9–10 ani în natură',
      statut_conservare: 'VU',
    },
    sections: [
      {
        h: 'Habitat',
        ps: ['Trăiește în tundra arctică din America de Nord și Eurasia. În sezonul rece, unele exemplare migrează spre sud.'],
      },
      {
        h: 'Hrană',
        ps: ['Hrana de bază sunt lemingii și alte rozătoare mici. Poate vâna și păsări, iar spre deosebire de multe bufnițe, este activă și în timpul zilei.'],
      },
      {
        h: 'Conservare',
        ps: ['Populațiile sunt influențate de disponibilitatea prăzii și de schimbările climatice, iar specia este considerată vulnerabilă.'],
      },
    ],
  },
  {
    slug: 'cat-de-des-se-periaza-un-caine',
    title: 'Cât de des se periază un câine',
    category: 'caini/ingrijire',
    excerpt: 'Frecvența periajului depinde de tipul de blană: de la o dată pe săptămână la zilnic.',
    metaTitle: 'Cât de des se periază un câine: ghid pe tipuri de blană',
    metaDescription: 'Ghid practic: frecvența periajului la câinii cu blană scurtă, lungă sau creață, ce perii se folosesc și cum faci periajul plăcut.',
    fields: {},
    sections: [
      {
        h: 'Depinde de tipul de blană',
        ps: [
          'Câinii cu blană scurtă se periază de obicei o dată sau de două ori pe săptămână. Cei cu blană lungă sau deasă au nevoie de periaj aproape zilnic.',
          'În perioadele de năpârlire, periajul mai frecvent ajută la îndepărtarea părului mort.',
        ],
      },
      {
        h: 'Ce perii folosești',
        ps: ['Pentru blana scurtă este potrivită o perie cu peri moi sau o mănușă de cauciuc. Pentru blana lungă se folosesc peria cu dinți metalici și pieptenele.'],
      },
      {
        h: 'Cum faci periajul mai plăcut',
        ps: ['Începe de la pui, în ședințe scurte, și oferă recompense. Periază în direcția firului de păr și fii atent la zonele sensibile, cum sunt cele de sub coate.'],
      },
    ],
  },
  {
    slug: 'displazia-de-sold-la-cainii-de-talie-mare',
    title: 'Displazia de șold la câinii de talie mare',
    category: 'caini/sanatate',
    excerpt: 'Displazia de șold este o afecțiune a articulației șoldului, frecventă la rasele mari. Iată semnele și măsurile de prevenție.',
    metaTitle: 'Displazia de șold la câini: semne, diagnostic, prevenție',
    metaDescription: 'Ce este displazia de șold la câini, ce rase sunt predispuse, ce semne apar și cum se pot reduce riscurile prin greutate și mișcare.',
    fields: {
      tldr: 'Displazia de șold este o malformație a articulației șoldului, mai frecventă la rasele mari. Diagnosticul și tratamentul sunt stabilite de medicul veterinar.',
    },
    sections: [
      {
        h: 'Ce este displazia de șold',
        ps: ['Este o afecțiune în care articulația șoldului nu se dezvoltă corect, ceea ce duce în timp la uzură și durere. Are o componentă ereditară și este influențată de creștere și greutate.'],
      },
      {
        h: 'Semne la care trebuie să fii atent',
        ps: ['Printre semne se numără șchiopătatul, dificultatea de a se ridica, reticența de a urca scări sau de a sări și scăderea activității.'],
      },
      {
        h: 'Prevenție și diagnostic',
        ps: [
          'Menținerea unei greutăți normale și o creștere echilibrată în perioada de pui reduc presiunea pe articulații. Diagnosticul se pune de medicul veterinar, de obicei prin examen clinic și radiografie.',
          'Dacă iei un pui de rasă mare, întreabă crescătorul despre controalele articulare ale părinților.',
        ],
      },
    ],
    faq: [
      { question: 'La ce vârstă apar semnele displaziei de șold?', answer: 'Pot apărea încă din primul an, dar uneori devin evidente abia la vârsta adultă sau la bătrânețe, odată cu artroza.' },
      { question: 'Se poate vindeca displazia de șold?', answer: 'Afecțiunea nu dispare de la sine. Medicul veterinar poate recomanda tratament medicamentos, kinetoterapie sau intervenție chirurgicală, în funcție de gravitate.' },
      { question: 'Ce rase sunt mai predispuse?', answer: 'Rasele mari și gigant, precum Ciobănescul German, Labradorul sau Rottweilerul, sunt mai des afectate, dar afecțiunea poate apărea și la alte rase.' },
    ],
  },
  {
    slug: 'calendarul-de-vaccinare-al-cainelui',
    title: 'Calendarul de vaccinare al câinelui',
    category: 'sanatate/vaccinare',
    excerpt: 'O prezentare generală a vaccinurilor recomandate câinilor și a momentelor în care se administrează.',
    metaTitle: 'Calendarul de vaccinare al câinelui: prezentare generală',
    metaDescription: 'Vaccinurile obișnuite pentru pui și câini adulți, rapelurile anuale și rolul medicului veterinar în stabilirea schemei de vaccinare.',
    fields: {},
    sections: [
      {
        h: 'De ce vaccinăm',
        ps: ['Vaccinarea protejează câinele împotriva unor boli grave și contagioase, precum rabia, parvoviroza sau boala Carré.'],
      },
      {
        h: 'Vaccinarea puiului',
        ps: ['Puii încep de regulă schema de vaccinare în jurul vârstei de 6–8 săptămâni, cu mai multe doze la intervale stabilite de medicul veterinar.'],
      },
      {
        h: 'Rapeluri la câinele adult',
        ps: ['Câinii adulți primesc rapeluri periodice. Schema exactă se stabilește împreună cu medicul veterinar, în funcție de vârstă, stil de viață și reglementările în vigoare.'],
      },
    ],
  },
  {
    slug: 'cum-alegi-primul-caine',
    title: 'Cum alegi primul câine',
    category: 'caini',
    excerpt: 'Câteva întrebări utile înainte de a lua un câine: timp, spațiu, buget și tipul de rasă potrivit stilului tău de viață.',
    metaTitle: 'Cum alegi primul câine: ghid pentru începători',
    metaDescription: 'Ghid pentru cine ia primul câine: stil de viață, spațiu, buget, rasă sau metis și pașii de pregătire înainte de adopție.',
    fields: {},
    sections: [
      {
        h: 'Gândește-te la stilul tău de viață',
        ps: ['Un câine are nevoie de timp, plimbări zilnice și atenție. Fii sincer cu tine în privința orelor în care ești plecat de acasă și a energiei pe care o poți oferi.'],
      },
      {
        h: 'Rasă, metis sau adopție',
        ps: [
          'Fiecare rasă are trăsături generale, dar fiecare câine este diferit. Câinii adulți din adăposturi au deja un caracter format, ceea ce ușurează alegerea.',
          'Dacă alegi un pui de rasă, caută un crescător responsabil, care permite vizitarea și oferă informații despre părinți.',
        ],
      },
      {
        h: 'Costuri și pregătire',
        ps: ['Pe lângă achiziție sau adopție, ia în calcul hrana, vaccinările, deparazitările, controalele veterinare și accesoriile. Pregătește casa înainte de sosirea câinelui.'],
      },
    ],
  },
]

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const domain = process.env.SEED_SITE_DOMAIN ?? 'localhost:3000'
  const site = await prisma.site.findUnique({ where: { domain } })
  if (!site) throw new Error(`Site not found: ${domain}`)
  const author = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!author) throw new Error('No user found')

  await prisma.site.update({ where: { id: site.id }, data: { template: 'divet' } })
  await prisma.seoSettings.update({
    where: { siteId: site.id },
    data: {
      siteName: 'DiVet',
      siteUrl: 'http://localhost:3000',
      defaultMetaTitle: 'DiVet — Enciclopedia animalelor din România',
      defaultMetaDesc:
        'Rase, specii și îngrijire: fișe structurate despre câini, pisici, păsări, pești, reptile și animale sălbatice.',
    },
  })
  console.log(`Site ${domain}: template=divet, SeoSettings updated`)

  const defs = await prisma.fieldDefinition.findMany({ where: { siteId: site.id } })
  const defByKey = new Map(defs.map((d) => [d.fieldKey, d.id]))

  let created = 0
  let updated = 0
  const DAY = 24 * 3600 * 1000

  for (let i = 0; i < POSTS.length; i++) {
    const p = POSTS[i]
    if (p.metaTitle.length > 60) throw new Error(`metaTitle too long (${p.metaTitle.length}): ${p.slug}`)
    if (p.metaDescription.length > 155)
      throw new Error(`metaDescription too long (${p.metaDescription.length}): ${p.slug}`)

    const [rootSlug, childSlug] = p.category.split('/')
    const root = await prisma.category.findFirst({ where: { siteId: site.id, parentId: null, slug: rootSlug } })
    if (!root) throw new Error(`Root category not found: ${rootSlug}`)
    let cat = root
    if (childSlug) {
      const child = await prisma.category.findFirst({ where: { siteId: site.id, parentId: root.id, slug: childSlug } })
      if (!child) throw new Error(`Subcategory not found: ${p.category}`)
      cat = child
    }

    const data = {
      title: p.title,
      excerpt: p.excerpt,
      contentJson: buildJson(p) as object,
      contentHtml: buildHtml(p),
      status: 'PUBLISHED' as const,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      categoryId: cat.id,
      authorId: author.id,
      featuredImageId: null,
      publishedAt: new Date(Date.now() - (i * 2 + 1) * DAY - i * 3600 * 1000),
    }
    const existing = await prisma.post.findUnique({ where: { siteId_slug: { siteId: site.id, slug: p.slug } } })
    const post = existing
      ? await prisma.post.update({ where: { id: existing.id }, data })
      : await prisma.post.create({ data: { ...data, siteId: site.id, slug: p.slug } })
    if (existing) updated++
    else created++

    const keys = Object.keys(p.fields)
    for (const key of keys) {
      const fieldDefinitionId = defByKey.get(key)
      if (!fieldDefinitionId) throw new Error(`Unknown field key: ${key}`)
      await prisma.fieldValue.upsert({
        where: { postId_fieldDefinitionId: { postId: post.id, fieldDefinitionId } },
        update: { value: p.fields[key] },
        create: { postId: post.id, fieldDefinitionId, value: p.fields[key] },
      })
    }
    await prisma.fieldValue.deleteMany({
      where: {
        postId: post.id,
        fieldDefinition: { fieldKey: { notIn: keys } },
      },
    })
    console.log(
      `${existing ? 'updated' : 'created'}  ${p.category.padEnd(36)} ${p.slug.padEnd(44)} fields=${keys.length}${p.faq ? ' faq=' + p.faq.length : ''}`
    )
  }

  // ── Autor si etichete (pentru /autor/[slug] si /eticheta/[slug]) ───────────
  await prisma.user.update({
    where: { id: author.id },
    data: {
      slug: 'redactia',
      name: 'Redacția DiVet',
      title: 'Echipa editorială',
      bio: 'Fișe verificate despre rase, specii și îngrijire, scrise și revizuite de echipa DiVet.',
      website: 'https://divet.ro',
    },
  })
  console.log('Author updated: /autor/redactia')

  const TAGS: Array<{ slug: string; name: string; posts: string[] }> = [
    { slug: 'rase-mari', name: 'Rase mari', posts: ['labrador-retriever', 'ciobanesc-german'] },
    {
      slug: 'ghiduri',
      name: 'Ghiduri',
      posts: [
        'cat-de-des-se-periaza-un-caine',
        'cum-alegi-primul-caine',
        'displazia-de-sold-la-cainii-de-talie-mare',
        'calendarul-de-vaccinare-al-cainelui',
      ],
    },
  ]
  for (const t of TAGS) {
    const tag = await prisma.tag.upsert({
      where: { siteId_slug: { siteId: site.id, slug: t.slug } },
      update: { name: t.name },
      create: { siteId: site.id, slug: t.slug, name: t.name },
    })
    const tagged = await prisma.post.findMany({
      where: { siteId: site.id, slug: { in: t.posts } },
      select: { id: true },
    })
    if (tagged.length !== t.posts.length) throw new Error(`Missing posts for tag ${t.slug}`)
    const { count } = await prisma.postTag.createMany({
      data: tagged.map((p) => ({ postId: p.id, tagId: tag.id })),
      skipDuplicates: true,
    })
    console.log(`tag ${t.slug.padEnd(10)} posts=${tagged.length} newLinks=${count}`)
  }

  console.log(`\nDone: ${created} created, ${updated} updated, ${POSTS.length} posts total`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
