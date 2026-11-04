import type { Metadata } from 'next'
import ToolPage from '@/components/frontend/templates/divet/ToolPage'
import FoodCheck from '@/components/tools/FoodCheck'
import { getToolsSite, publishedSlugs } from '@/lib/tools/site'

export const dynamic = 'force-dynamic'

const PATH = '/instrumente/aliment-periculos'
const TITLE = 'E periculos pentru câine sau pisică?'
const LEAD =
  'Caută un aliment sau o substanță și vezi dacă este documentată ca periculoasă pentru câini sau pisici. Lista conține doar substanțe periculoase; lipsa unei intrări nu înseamnă că este sigură.'

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, siteUrl } = await getToolsSite()
  const canonical = `${siteUrl.replace(/\/$/, '')}${PATH}`
  return {
    title: `${TITLE} | ${siteName}`,
    description: 'Verifică rapid dacă ciocolata, strugurii, xilitolul, ceapa sau crinii sunt periculoși pentru câini și pisici, cu link spre articolele cu surse.',
    alternates: { canonical },
    openGraph: { title: TITLE, description: LEAD, url: canonical },
  }
}

const EXPLAINER = `
<h2>Cum folosești verificatorul</h2>
<p>Scrie numele alimentului sau al substanței și alege animalul. Dacă apare în listă, vezi un rezumat și linkul către articolul cu surse. Lista se completează pe măsură ce publicăm articole noi de sănătate.</p>
<h2>Ce trebuie să știi</h2>
<ul>
<li>Instrumentul arată <strong>doar</strong> substanțe documentate ca periculoase. Dacă un aliment nu apare, nu înseamnă că este sigur pentru animal.</li>
<li>Nu dăm cantități sau doze: toxicitatea depinde de specie, de cantitate și de greutatea animalului, iar evaluarea o face medicul veterinar.</li>
<li>Dacă animalul a mâncat deja ceva periculos, sună imediat la cabinetul veterinar sau la o clinică de urgențe, chiar dacă nu are simptome.</li>
</ul>`

const SOURCES = [
  { label: 'Merck Veterinary Manual: ghiduri despre toxicologie la animale', href: 'https://www.merckvetmanual.com/toxicology' },
  { label: 'ASPCA Animal Poison Control: alimente de evitat', href: 'https://www.aspca.org/pet-care/animal-poison-control/people-foods-avoid-feeding-your-pets' },
]

const FAQ = [
  {
    question: 'Ce fac dacă animalul a mâncat ceva periculos?',
    answer: 'Sună imediat la veterinar sau la o clinică de urgențe, spune ce și cât a consumat și când. Nu provoca voma și nu da medicamente fără indicația medicului.',
  },
  {
    question: 'Dacă un aliment nu apare în listă, este sigur?',
    answer: 'Nu. Lista conține doar substanțe documentate ca periculoase și nu este completă. Întreabă medicul veterinar înainte să dai animalului alimente noi.',
  },
  {
    question: 'Există o cantitate sigură dintr-o substanță periculoasă?',
    answer: 'Nu o putem indica. Toxicitatea depinde de specie, de greutate și de tipul produsului, așa că articolele nu dau doze. Evaluarea o face medicul veterinar.',
  },
]

export default async function Page() {
  const { siteId, siteName, siteUrl } = await getToolsSite()
  const slugs = await publishedSlugs(siteId, 'substante-toxice')
  return (
    <ToolPage site={{ siteName, siteUrl }} path={PATH} title={TITLE} lead={LEAD} explainer={EXPLAINER} sources={SOURCES} faq={FAQ}>
      <FoodCheck availableSlugs={slugs} />
    </ToolPage>
  )
}
