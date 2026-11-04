import type { Metadata } from 'next'
import ToolPage from '@/components/frontend/templates/divet/ToolPage'
import DogAgeCalculator from '@/components/tools/DogAgeCalculator'
import { getToolsSite } from '@/lib/tools/site'

export const dynamic = 'force-dynamic'

const PATH = '/instrumente/varsta-caine'
const TITLE = 'Vârsta câinelui în ani umani'
const LEAD =
  'Calculatorul transformă vârsta câinelui în ani umani cu formula din studiul Cell Systems 2020: 16 · ln(vârsta) + 31. Rezultatul este orientativ și nu înlocuiește evaluarea medicului veterinar.'

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, siteUrl } = await getToolsSite()
  const canonical = `${siteUrl.replace(/\/$/, '')}${PATH}`
  return {
    title: `${TITLE} | ${siteName}`,
    description: 'Calculator pentru vârsta câinelui în ani umani, cu formula epigenetică din studiul Cell Systems 2020 și limitele ei explicate.',
    alternates: { canonical },
    openGraph: { title: TITLE, description: LEAD, url: canonical },
  }
}

const EXPLAINER = `
<h2>Cum se calculează</h2>
<p>Formula folosită este <strong>vârsta umană = 16 · ln(vârsta câinelui) + 31</strong>, unde „ln” este logaritmul natural, iar vârsta câinelui se exprimă în ani. Pentru un câine de 1 an rezultă aproximativ 31 de ani umani, iar pentru unul de 4 ani aproximativ 53.</p>
<p>Formula vine dintr-un studiu publicat în <em>Cell Systems</em> în 2020 de cercetători de la University of California San Diego. Ei au comparat tiparele de metilare a ADN-ului (un indicator al îmbătrânirii biologice) la 104 Labrador retriever cu cele ale oamenilor și au găsit că îmbătrânirea câinilor nu este liniară: este rapidă în primii ani și încetinește la maturitate.</p>
<h2>Ce nu spune calculatorul</h2>
<ul>
<li>Studiul a folosit o singură rasă, Labrador retriever, cu vârste între 0,1 și 16 ani. Autorii notează că unele rase trăiesc mai mult decât altele, deci pentru alte rase rezultatul poate fi mai puțin precis.</li>
<li>Rezultatul compară „ritmul de îmbătrânire biologică”, nu stadiul de viață. Nu spune când un câine este „senior”, nici ce analize sau controale are nevoie.</li>
<li>Peste 16 ani, valoarea este o extrapolare.</li>
</ul>
<p>Pentru întrebări despre sănătatea câinelui la o anumită vârstă, discută cu medicul veterinar.</p>`

const SOURCES = [
  {
    label: 'Wang et al., „Quantitative Translation of Dog-to-Human Aging by Conserved Remodeling of the DNA Methylome”, Cell Systems, 2020 (text integral, PMC)',
    href: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7484147',
  },
  { label: 'UC San Diego / EurekAlert: comunicatul despre studiu', href: 'https://www.eurekalert.org/news-releases/658836' },
]

const FAQ = [
  {
    question: 'Un an de câine înseamnă șapte ani umani?',
    answer:
      'Nu. Regula „1 an = 7 ani” este o simplificare. Studiul Cell Systems 2020 arată o curbă neliniară: un câine de 1 an este comparabil cu un om de aproximativ 30 de ani, apoi ritmul încetinește.',
  },
  {
    question: 'Formula este valabilă pentru toate rasele?',
    answer:
      'Nu este confirmat. Studiul a folosit doar Labrador retriever, iar autorii notează că unele rase trăiesc mai mult decât altele. Rezultatul trebuie citit ca o estimare.',
  },
  {
    question: 'De ce nu apare vârsta sub 3 luni?',
    answer:
      'Formula logaritmică dă valori fără sens pentru puii foarte mici, iar studiul nu are un interval de validitate stabilit sub această vârstă. Calculatorul acceptă de la 3 luni.',
  },
  {
    question: 'Pot decide cu acest calculator când trece câinele la hrană pentru seniori?',
    answer:
      'Nu. Etapa de viață și hrana potrivită depind de rasă, greutate și starea de sănătate. Întreabă medicul veterinar.',
  },
]

export default async function Page() {
  const { siteName, siteUrl } = await getToolsSite()
  return (
    <ToolPage site={{ siteName, siteUrl }} path={PATH} title={TITLE} lead={LEAD} explainer={EXPLAINER} sources={SOURCES} faq={FAQ}>
      <DogAgeCalculator />
    </ToolPage>
  )
}
