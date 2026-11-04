import { PrismaClient, PostStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { serverHtmlToTiptapJson } from '../lib/tiptap/server-html-parser'

// Prisma 7 cere un adapter; la fel construiesc clientul lib/prisma.ts si prisma/seed.ts.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

type PageDef = { slug: string; title: string; metaTitle: string; metaDescription: string; html: string }

const PAGES: PageDef[] = [
  {
    slug: 'politica-editoriala',
    title: 'Politica editorială',
    metaTitle: 'Politica editorială DiVet',
    metaDescription:
      'Cum sunt scrise și verificate articolele DiVet: autori, surse, articole de sănătate, mențiunea „Revizuit medical”, corecturi și publicitate.',
    html: `<p>Această pagină spune cum sunt făcute articolele DiVet, ca să știi ce poți și ce nu poți să te bazezi pe ele.</p>
<h2>Cine scrie articolele</h2>
<p>Articolele sunt scrise de Redacția DiVet cu ajutorul instrumentelor de inteligență artificială și pe baza surselor publice pe care le linkăm în text. Un articol nu este scris de un medic veterinar, decât dacă pagina lui spune explicit altfel.</p>
<h2>Cum alegem și verificăm informațiile</h2>
<ul>
<li>Folosim surse primare și specializate: manuale veterinare, ghiduri ale asociațiilor profesionale (de exemplu WSAVA, AAHA, ESCCAP), universități de medicină veterinară și autoritatea sanitar-veterinară din România (ANSVSA).</li>
<li>Afirmațiile importante trimit la sursa lor, în text. Când sursele diferă, spunem că diferă, în loc să alegem o valoare.</li>
<li>Nu publicăm statistici fără sursă și nu inventăm cifre.</li>
<li>Imaginile provin, de regulă, din Wikimedia Commons, cu autorul și licența menționate la finalul articolului.</li>
</ul>
<h2>Articolele de sănătate</h2>
<p>Articolele din secțiunea Sănătate sunt informative. Nu stabilesc diagnostice, nu dau doze și nu recomandă tratamente de făcut acasă. Fiecare arată de la început cât de urgentă este situația și când mergi la medicul veterinar.</p>
<p>Mențiunea „Revizuit medical de …”, cu numele, calificarea și data, apare doar pe articolele pe care medicul veterinar numit pe pagină le-a citit efectiv. Un articol fără această mențiune nu a fost revizuit medical.</p>
<h2>Corecturi și actualizări</h2>
<p>Dacă găsești o greșeală sau o informație depășită, scrie-ne la <a href="mailto:hello@divet.ro">hello@divet.ro</a>. Verificăm sursele, corectăm articolul și actualizăm data „Actualizat” de pe pagină.</p>
<h2>Publicitate</h2>
<p>Site-ul afișează reclame Google AdSense, separate de conținutul articolelor. DiVet este operat de Uppley SRL.</p>`,
  },
  {
    slug: 'echipa',
    title: 'Echipa DiVet',
    metaTitle: 'Echipa DiVet',
    metaDescription: 'Cine face DiVet: Redacția DiVet, cum lucrăm și cum se marchează articolele revizuite de un medic veterinar.',
    html: `<p>DiVet este o enciclopedie în limba română despre animale, făcută de Redacția DiVet.</p>
<h2>Redacția DiVet</h2>
<p>Redacția pregătește articolele cu ajutorul instrumentelor de inteligență artificială, pornind de la surse publice linkate în text, și le actualizează când apar informații noi. Metoda este descrisă în <a href="/politica-editoriala">politica editorială</a>.</p>
<h2>Recenzie medicală</h2>
<p>Articolele de sănătate pot fi citite de un medic veterinar. Când se întâmplă asta, numele, calificarea și data revizuirii apar pe pagina articolului, iar pagina medicului din secțiunea Autori listează articolele pe care le-a revizuit. Articolele fără această mențiune nu au fost revizuite medical.</p>
<h2>Contact</h2>
<p>Pentru corecturi, sugestii sau colaborări: <a href="mailto:hello@divet.ro">hello@divet.ro</a>.</p>`,
  },
]

async function main() {
  const domain = process.env.SEED_SITE_DOMAIN ?? 'divet.ro'
  const site = await prisma.site.findFirst({ where: { domain } })
  if (!site) throw new Error(`Site-ul ${domain} nu exista in baza`)

  // Autorul tehnic al paginilor: utilizatorul public "redactia", daca exista; altfel primul utilizator al site-ului.
  const author =
    (await prisma.user.findUnique({ where: { slug: 'redactia' } })) ??
    (await prisma.userSiteAccess.findFirst({ where: { siteId: site.id }, include: { user: true } }))?.user
  if (!author) throw new Error('Nu exista niciun utilizator care sa fie autorul paginilor')

  for (const p of PAGES) {
    const existing = await prisma.page.findUnique({ where: { siteId_slug: { siteId: site.id, slug: p.slug } } })
    if (existing) {
      // Nu suprascriem: textul poate fi editat din admin.
      console.log(`exista deja, nu modific: ${p.slug}`)
      continue
    }
    await prisma.page.create({
      data: {
        siteId: site.id,
        authorId: author.id,
        slug: p.slug,
        title: p.title,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        contentHtml: p.html,
        contentJson: serverHtmlToTiptapJson(p.html) as never,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    })
    console.log(`creat: ${p.slug}`)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
