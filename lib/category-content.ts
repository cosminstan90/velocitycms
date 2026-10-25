/**
 * Continut editorial pentru paginile de categorie (grup si subcategorie).
 *
 * Cheia este calea categoriei: "caini" pentru un grup, "caini/rase" pentru o subcategorie.
 * Aici stau doar textele; articolele, numaratorile si linkurile catre alte sectiuni se iau
 * din baza de date (lib/silo.ts), ca sa nu apara niciodata un link catre o pagina goala.
 */

export type CategoryFaq = { question: string; answer: string }

export type CategoryContent = {
  /** <title> fara sufixul de site; <= ~52 de caractere. */
  metaTitle: string
  /** Meta description, 130-155 de caractere. */
  metaDesc: string
  /** Paragrafe de introducere, afisate sub titlu, doar pe prima pagina a listei. */
  intro: string[]
  faq: CategoryFaq[]
  /** Alte grupuri (slug radacina) spre care trimite sectiunea "Alte sectiuni", cu o fraza de legatura. */
  related: Array<{ group: string; blurb: string }>
}

export const CATEGORY_CONTENT: Readonly<Record<string, CategoryContent>> = {
  caini: {
    metaTitle: 'Câini: rase, îngrijire și sănătate',
    metaDesc:
      'Ghid despre câini: rase de talie mică, medie și mare, temperament, dresaj, îngrijire și sănătate, cu articole comparative și răspunsuri clare.',
    intro: [
      'Aici găsești tot ce ține de câini: rasele, de la cele mici de apartament la cele mari de pază, dar și îngrijirea de zi cu zi, sănătatea, dresajul și alimentația. Fiecare articol urmează același format, ca să poți compara rapid rasele între ele.',
      'Alegerea unei rase se face după patru lucruri: talia, nivelul de energie, timpul pe care îl poți oferi și spațiul de acasă. O rasă de vânătoare sau de păstor are nevoie de ore de mișcare, în timp ce o rasă mică de companie se descurcă bine în apartament, dar cere periaj și atenție.',
      'Începe cu secțiunea de rase, apoi citește despre îngrijire și sănătate înainte să aduci un pui acasă. Costurile veterinare, vaccinările și testele genetice ale părinților contează la fel de mult ca aspectul.',
    ],
    faq: [
      {
        question: 'Cum aleg o rasă de câine potrivită?',
        answer:
          'Pornește de la stilul tău de viață: câtă mișcare poți oferi zilnic, cât spațiu ai, dacă ai copii și cât timp lipsești de acasă. Apoi compară rasele după talie, energie, nevoia de dresaj și problemele de sănătate frecvente.',
      },
      {
        question: 'Ce rase de câini sunt potrivite pentru apartament?',
        answer:
          'Rasele mici sau liniștite se adaptează mai ușor, dar contează mai mult mișcarea zilnică decât metrajul. O rasă mare și calmă poate trăi la bloc, iar una mică și foarte activă poate deveni agitată fără plimbări.',
      },
      {
        question: 'De ce diferă greutatea și speranța de viață între surse?',
        answer:
          'Standardele rasei, crescătorii și studiile veterinare folosesc eșantioane și metode diferite. În articole menționăm intervalele întâlnite și semnalăm când sursele nu se potrivesc.',
      },
    ],
    related: [
      { group: 'pisici', blurb: 'Compară câinii cu pisicile: timp necesar, spațiu, costuri și îngrijire.' },
      { group: 'salbatice', blurb: 'Mamifere din natură, pentru cei care vor să înțeleagă și animalele din afara casei.' },
    ],
  },

  'caini/rase': {
    metaTitle: 'Rase de câini: caracteristici și comparații',
    metaDesc:
      'Rase de câini explicate clar: origine, talie, temperament, dresaj, îngrijire și sănătate. Fiecare articol include tabel comparativ cu rase apropiate.',
    intro: [
      'Rasele de câini diferă mult ca talie, energie și caracter. Fiecare articol de aici descrie originea rasei, aspectul, temperamentul, îngrijirea, alimentația și problemele de sănătate frecvente, plus un tabel care o compară cu alte rase.',
      'Rasele sunt grupate după rolul pentru care au fost crescute: câini de pază și de păstor, câini de vânătoare (de urmărit după miros, de aret, de recuperare) și câini de companie. Rolul inițial explică mult din comportament: un câine de pază este rezervat cu străinii, unul de vânătoare are nevoie de mișcare multă, iar unul de companie caută atenția stăpânului.',
      'Când două rase par asemănătoare, citește tabelul comparativ din fiecare articol și secțiunea „Cum alegi un pui”: ea explică ce teste de sănătate să ceri crescătorului și ce greșeli să eviți.',
    ],
    faq: [
      {
        question: 'Ce înseamnă grupele FCI în clasificarea raselor?',
        answer:
          'FCI împarte rasele în 10 grupe după rolul lor, de exemplu câini de păstor, câini de aret sau câini de urmărit după miros. Grupa indică rolul pentru care a fost crescută rasa, nu un nivel de calitate.',
      },
      {
        question: 'Cum compar două rase de câini?',
        answer:
          'Uită-te la talie, nivelul de energie, nevoia de dresaj, toleranța la singurătate și problemele de sănătate. Fiecare articol are un tabel comparativ cu rase apropiate, care pune aceste trăsături una lângă alta.',
      },
      {
        question: 'Rasele mari sunt mai greu de ținut?',
        answer:
          'Costă mai mult la hrană și veterinar și cer un dresaj început devreme, pentru că un câine de peste 40 kg nu se mai controlează prin forță. Multe rase mari sunt însă calme și se adaptează bine la familie.',
      },
    ],
    related: [
      { group: 'pisici', blurb: 'Dacă ezitați între un câine și o pisică, vedeți rasele de pisici și cât timp cer.' },
    ],
  },

  pisici: {
    metaTitle: 'Pisici: rase, îngrijire și sănătate',
    metaDesc:
      'Ghid despre pisici: rase cu blană scurtă și lungă, temperament, îngrijire, alimentație și sănătate, cu articole comparative și răspunsuri clare.',
    intro: [
      'Pisicile sunt animale de companie care cer mai puțin spațiu decât câinii, dar au nevoie de stimulare, joacă și un mediu sigur. În această secțiune găsești rasele de pisici, îngrijirea blănii, alimentația, comportamentul și problemele de sănătate.',
      'La alegerea unei rase contează tipul de blană, nivelul de activitate și cât timp rămâne pisica singură. Rasele cu blană lungă cer periaj regulat, cele active au nevoie de turnuri de cățărat și jocuri, iar cele foarte atașate de oameni suportă greu singurătatea.',
      'Multe rase au afecțiuni ereditare cunoscute, de exemplu cardiomiopatia hipertrofică. Un crescător serios testează părinții și îți arată rezultatele, iar pedigree-ul emis de o asociație recunoscută este singura dovadă sigură a rasei.',
    ],
    faq: [
      {
        question: 'Ce rasă de pisică este potrivită pentru apartament?',
        answer:
          'Majoritatea raselor se adaptează la apartament dacă primesc jocuri zilnice, un loc de cățărat și un stâlp de zgâriat. Rasele calme sunt mai ușor de ținut în spații mici, iar cele foarte active cer mai multă stimulare.',
      },
      {
        question: 'Există pisici cu adevărat hipoalergenice?',
        answer:
          'Nu. Alergia vine din proteine prezente în saliva și pielea tuturor pisicilor. Unele rase pot provoca reacții mai ușoare, dar nicio rasă nu este garantat sigură pentru alergici. Testează reacția în contact direct înainte de adopție.',
      },
      {
        question: 'Cum recunosc un crescător responsabil?',
        answer:
          'Îți arată părinții, pedigree-ul și actele de vaccinare, face teste genetice pentru bolile frecvente ale rasei și nu vinde pisoi sub vârsta recomandată. Evită anunțurile fără acte și prețurile prea mici sau exagerate.',
      },
    ],
    related: [
      { group: 'caini', blurb: 'Vezi și rasele de câini, dacă vrei să compari un animal de companie activ cu unul independent.' },
      { group: 'salbatice', blurb: 'Felinele sălbatice și alte mamifere din natură, rudele îndepărtate ale pisicii domestice.' },
    ],
  },

  'pisici/rase': {
    metaTitle: 'Rase de pisici: caracteristici și comparații',
    metaDesc:
      'Rase de pisici explicate clar: origine, blană, temperament, îngrijire și sănătate. Fiecare articol include tabel comparativ cu rase apropiate.',
    intro: [
      'Rasele de pisici se deosebesc prin tipul de blană, mărime, energie și relația cu omul. Fiecare articol prezintă originea, aspectul, temperamentul, îngrijirea, alimentația și sănătatea rasei, plus un tabel care o compară cu alte rase.',
      'Poți răsfoi rasele după nevoile tale: pisici calme și independente, pisici active și vorbărețe, pisici mari cu blană lungă sau rase rare, cu istorie scurtă și populație mică. Pentru rasele rare, semnalăm și când originea sau recunoașterea oficială sunt disputate.',
      'Citește secțiunea „Cum alegi un pisoi” din fiecare articol: ea explică ce teste să ceri crescătorului și cum eviți anunțurile care vând pisici fără acte drept rase de colecție.',
    ],
    faq: [
      {
        question: 'Cum aleg între o rasă cu blană scurtă și una cu blană lungă?',
        answer:
          'Blana scurtă cere periaj săptămânal, iar cea lungă periaj de câteva ori pe săptămână, ca să nu se formeze noduri. Diferența de efort este mai mare decât diferența de cantitate de păr vărsat.',
      },
      {
        question: 'Ce rase de pisici sunt mai atașate de om?',
        answer:
          'Rasele sociabile, cum sunt cele orientale și unele rase cu păr scurt, caută compania și suportă greu singurătatea. Rasele independente se descurcă mai bine dacă lipsești o parte din zi.',
      },
      {
        question: 'De ce contează testele genetice la o pisică de rasă?',
        answer:
          'Unele rase au boli ereditare frecvente, de exemplu probleme cardiace sau renale. Testele părinților reduc riscul la pui și îți arată dacă crescătorul este serios.',
      },
    ],
    related: [{ group: 'caini', blurb: 'Compară cu rasele de câini, pentru o decizie informată între cele două tipuri de companion.' }],
  },

  marine: {
    metaTitle: 'Animale marine: specii, hrană, habitat',
    metaDesc:
      'Animale marine explicate clar: mamifere marine, rechini și pești, nevertebrate și păsări marine, cu hrană, habitat, longevitate și statut de conservare.',
    intro: [
      'Mările și oceanele adăpostesc de la balene de zeci de tone până la animale fără oase, cum sunt castraveții și ariciii de mare. Această secțiune acoperă mamiferele marine, rechinii și peștii, nevertebratele și păsările marine, cu fapte verificate și cifre explicate.',
      'Pentru fiecare specie prezentăm mărimea, hrana, habitatul, reproducerea, durata de viață și statutul de conservare. Unde sursele nu se potrivesc, mai ales la mărimi record și la evaluările IUCN, spunem asta explicit și indicăm intervalul.',
      'Poți începe cu animalele mari, ușor de recunoscut, apoi poți merge spre nevertebrate. Multe specii marine depind de același lanț trofic, de la krill la prădători, iar schimbările climatice afectează mai ales speciile din zonele reci.',
    ],
    faq: [
      {
        question: 'Care este diferența dintre balenele cu fanoane și cele cu dinți?',
        answer:
          'Balenele cu fanoane filtrează apa ca să rețină krill și pești mici, iar cele cu dinți vânează prada individual. Majoritatea balenelor uriașe, cum sunt cea albastră sau cea cu cocoașă, sunt cu fanoane.',
      },
      {
        question: 'De ce statutul de conservare diferă între surse?',
        answer:
          'Evaluările IUCN pot fi făcute global sau pe populații regionale, iar unele specii sunt considerate de risc minim la nivel global, dar vulnerabile într-o anumită zonă. Verifică mereu Lista Roșie IUCN pentru statutul curent.',
      },
      {
        question: 'Care sunt cele mai amenințate animale marine?',
        answer:
          'Printre cele mai amenințate se numără peștii fierăstrău și unele specii de rechini, afectate de pescuit și de pierderea habitatelor costiere. Schimbările climatice afectează și speciile care depind de gheață.',
      },
    ],
    related: [
      { group: 'salbatice', blurb: 'Mamifere din natură, inclusiv speciile arctice care depind de gheața marină.' },
      { group: 'insecte', blurb: 'Alte nevertebrate: insectele, cel mai numeros grup de animale de pe uscat.' },
    ],
  },

  'marine/mamifere-marine': {
    metaTitle: 'Mamifere marine: balene și alte specii',
    metaDesc:
      'Mamifere marine: balene cu fanoane, hrană, migrații, longevitate și statut de conservare, explicate clar și cu surse, într-un singur loc.',
    intro: [
      'Mamiferele marine respiră aer, își hrănesc puii cu lapte și trăiesc în ocean. Aici găsești balenele, cele mai mari animale din lume, cu mărimea, hrana, migrația și durata de viață a fiecărei specii.',
      'Balenele cu fanoane se hrănesc prin filtrare, iar unele fac migrații de mii de kilometri între zonele reci de hrănire și apele calde de reproducere. Longevitatea variază enorm: unele specii trăiesc câteva decenii, altele peste 200 de ani.',
      'Majoritatea speciilor au fost aproape de dispariție din cauza vânătorii comerciale. Moratoriul din 1986 a ajutat la refacerea unor populații, dar coliziunile cu navele, plasele de pescuit și zgomotul din oceane rămân amenințări.',
    ],
    faq: [
      {
        question: 'Care este cea mai longevivă balenă?',
        answer:
          'Balena de Groenlanda, cu peste 200 de ani după mai multe surse. Cel mai bătrân exemplar documentat ar fi avut 211 ani, iar vârsta se estimează după urmele vechilor harpoane.',
      },
      {
        question: 'Cât de mari sunt balenele cu fanoane?',
        answer:
          'Variază de la circa 12–18 m la speciile mijlocii până la aproape 30 m la balena albastră. Greutatea ajunge de la zeci de tone la peste o sută.',
      },
      {
        question: 'Cum migrează balenele?',
        answer:
          'Multe specii petrec vara în ape reci, bogate în krill, și iarna se mută în ape calde, unde se împerechează și nasc. Distanța poate depăși 8.000 km, iar în zonele calde mănâncă puțin.',
      },
    ],
    related: [
      { group: 'salbatice', blurb: 'Mamiferele din natură: de la urșii polari, care vânează focile pe gheață, până la alte specii.' },
    ],
  },

  'marine/rechini-si-pesti': {
    metaTitle: 'Rechini și pești marini: specii și conservare',
    metaDesc:
      'Rechini și pești marini explicați clar: mărime, habitat, hrană, pericol pentru oameni și statut de conservare, cu comparații între specii apropiate.',
    intro: [
      'Rechinii și razele sunt pești cartilaginoși, cu schelet din cartilaj, nu din os. Aici găsești specii de la prădători de coastă, care intră și în râuri, până la pești cu aspect neobișnuit, cum sunt cei cu bot dințat.',
      'Mulți oameni confundă grupele: peștele fierăstrău, de exemplu, este o rază, nu un rechin, iar rechinul-fierăstrău este un alt animal. Articolele explică aceste diferențe într-un tabel, cu branhiile, mărimea și habitatul fiecăruia.',
      'Mai multe specii sunt periclitate din cauza pescuitului și a distrugerii estuarelor și mangrovelor. Spunem clar ce este un risc real pentru oameni și ce este exagerat în presă, și indicăm unde evaluările de conservare diferă.',
    ],
    faq: [
      {
        question: 'Care este diferența dintre un rechin și o rază?',
        answer:
          'Ambele sunt pești cartilaginoși. La rechini branhiile se află pe laturile capului, iar la raze pe partea de jos a corpului. Razele au, în general, corpul turtit, cu înotătoare late, ca niște aripi.',
      },
      {
        question: 'Pot rechinii să trăiască în apă dulce?',
        answer:
          'Unii pot. Rechinul taur tolerează apa dulce și sărată și intră în râuri și lacuri, uneori la sute de kilometri de mare. Majoritatea speciilor rămân însă în apă sărată.',
      },
      {
        question: 'Cât de periculoși sunt rechinii pentru oameni?',
        answer:
          'Puține specii sunt implicate frecvent în incidente, iar riscul depinde de zonă și de comportament. Evită apele tulburi, gurile râurilor și orele de apus și respectă avertismentele locale.',
      },
    ],
    related: [
      { group: 'salbatice', blurb: 'Alte specii de prădători din natură, pe uscat și în apropierea apei.' },
    ],
  },

  'marine/nevertebrate-marine': {
    metaTitle: 'Nevertebrate marine: caracatițe, arici de mare',
    metaDesc:
      'Nevertebrate marine: caracatițe, castraveți de mare, arici de mare. Cum arată, ce mănâncă, cum se apără și ce rol au în ecosistem.',
    intro: [
      'Nevertebratele marine sunt animalele fără coloană vertebrală: caracatițe și alte cefalopode, echinoderme precum ariciul de mare sau castravetele de mare, și multe altele. Reprezintă marea majoritate a speciilor din ocean.',
      'Aici explicăm cum funcționează corpul lor, de la cele trei inimi ale caracatiței până la lanterna lui Aristotel a ariciului de mare, ce mănâncă și cum se apără. Mulți au adaptări surprinzătoare: își schimbă culoarea, își regenerează organele sau răscolesc sedimentul și hrănesc recifurile.',
      'Nevertebratele sunt și indicatori ai sănătății mării. Pescuitul intens, poluarea și schimbările de temperatură le afectează rapid, iar dispariția unor specii poate dezechilibra tot ecosistemul din jur.',
    ],
    faq: [
      {
        question: 'Ce sunt echinodermele?',
        answer:
          'Un grup de animale marine cu simetrie radiară, care include ariciul de mare, steaua de mare și castravetele de mare. Se deplasează cu picioare ambulacrare și nu au scheletul din os.',
      },
      {
        question: 'Sunt caracatițele inteligente?',
        answer:
          'Da, sunt considerate printre cele mai inteligente nevertebrate. Folosesc unelte, învață repede și se plictisesc ușor în captivitate, de aceea îngrijitorii le oferă jucării și jocuri.',
      },
      {
        question: 'Pot fi ținute nevertebratele marine într-un acvariu?',
        answer:
          'Unele specii da, dar cer un acvariu stabil, matur și experiență. Multe sunt sensibile la schimbări de apă, iar unele pot elibera toxine dacă sunt stresate, deci informează-te înainte să cumperi.',
      },
    ],
    related: [
      { group: 'insecte', blurb: 'Alte nevertebrate: insectele și gândacii, cu adaptări la fel de neobișnuite pe uscat.' },
    ],
  },

  'marine/pasari-marine': {
    metaTitle: 'Păsări marine: pinguini și alte specii',
    metaDesc:
      'Păsări marine: pinguini și alte specii adaptate vieții pe mare, cu hrană, reproducere, rezistență la frig și statut de conservare.',
    intro: [
      'Păsările marine își petrec o mare parte din viață pe ocean și pe coastele reci sau stâncoase. Pinguinii sunt cele mai cunoscute: nu zboară, dar înoată și se scufundă excelent, prinzând pești, krill și calmari.',
      'Articolele explică cum rezistă la frig prin grăsime și penaj dens, cum își cresc puii și cum diferă speciile între ele, de la pinguinul-împărat din Antarctica până la cel din insulele Galápagos, aproape de ecuator.',
      'Multe specii sunt periclitate de schimbările climatice, de pescuit și de pierderea locurilor de cuibărit. Indicăm statutul de conservare și diferențele dintre evaluări.',
    ],
    faq: [
      {
        question: 'De ce nu zboară pinguinii?',
        answer:
          'Aripile lor s-au transformat în înotătoare, potrivite pentru înot și scufundări, nu pentru zbor. Corpul aerodinamic și penajul dens îi ajută să înoate rapid.',
      },
      {
        question: 'Toți pinguinii trăiesc în zone reci?',
        answer:
          'Nu. Pinguinul-împărat trăiește în Antarctica, dar există specii pe coastele Africii de Sud, Australiei și Americii de Sud, iar pinguinul Galápagos trăiește aproape de ecuator.',
      },
      {
        question: 'Ce mănâncă păsările marine?',
        answer:
          'Depinde de specie: pești, krill, calmari sau crustacee. Pinguinii vânează sub apă și înghit prada întreagă.',
      },
    ],
    related: [
      { group: 'salbatice', blurb: 'Mamifere polare care împart habitatul rece cu păsările marine, de la urși la alți prădători.' },
    ],
  },

  insecte: {
    metaTitle: 'Insecte: gândaci, specii exotice, camuflaj',
    metaDesc:
      'Insecte explicate clar: gândaci, insecte exotice și specii comune, cu mărime, hrană, ciclu de viață, camuflaj și îngrijire în terariu.',
    intro: [
      'Insectele sunt cel mai numeros grup de animale de pe uscat. În această secțiune găsești gândaci, insecte exotice cu camuflaj spectaculos și specii comune din grădină, cu mărime, hrană, ciclu de viață și rolul lor în natură.',
      'Multe sunt utile: descompun lemnul mort, hrănesc păsări și alte animale și polenizează plantele. Altele sunt ținute ca animale de companie în terarii, iar articolele spun ce condiții cer și de ce nu trebuie eliberate niciodată în natură.',
      'Pentru fiecare specie indicăm unde trăiește, cât de mare ajunge, cât trăiește și cum se apără, cu cifre însoțite de sursă. Acolo unde datele diferă, mai ales la recorduri de mărime și durată de viață, menționăm intervalul.',
    ],
    faq: [
      {
        question: 'Care este diferența dintre insecta frunză și insecta băț?',
        answer:
          'Ambele fac parte din ordinul Phasmatodea. Insecta frunză imită o frunză, cu corp aplatizat, iar insecta băț imită o crenguță, cu corp alungit și subțire.',
      },
      {
        question: 'Pot fi ținute insectele exotice în casă?',
        answer:
          'Unele da, în terarii adaptate, cu frunze proaspete sau hrană specifică. Cumpără doar de la crescători autorizați și nu elibera niciodată animalele în natură, pentru că pot deveni invazive.',
      },
      {
        question: 'Sunt insectele periculoase pentru oameni?',
        answer:
          'Majoritatea speciilor prezentate aici, cum sunt gândacii rinocer sau licuricii, nu mușcă și nu înțeapă. Pentru speciile cu venin sau care pot provoca reacții, indicăm precauțiile în articol.',
      },
    ],
    related: [
      { group: 'marine', blurb: 'Alte nevertebrate, din ocean: caracatițe, arici și castraveți de mare.' },
      { group: 'salbatice', blurb: 'Animalele pe care le hrănesc insectele în natură, de la păsări la mamifere.' },
    ],
  },

  'insecte/gandaci': {
    metaTitle: 'Gândaci: specii, corn, ciclu de viață',
    metaDesc:
      'Gândaci explicați clar: gândacul rinocer, gândacul lui Hercule, licuricii. Mărime, forță, hrană, ciclu de viață și rol în ecosistem.',
    intro: [
      'Gândacii formează ordinul Coleoptera, cel mai mare dintre toate grupurile de animale. Aici găsești specii cunoscute, de la gândacii cu corn la licurici, cu mărime, hrană și ciclul de viață de la ou la adult.',
      'Mulți trăiesc mai mult ca larve decât ca adulți. Larvele gândacilor mari descompun lemnul mort și îl transformă în humus, iar adulții se hrănesc cu fructe, nectar sau, la unele specii, aproape deloc.',
      'Cornul masculilor, la gândacii rinocer și la cei ai lui Hercule, este o armă în luptele dintre rivali, nu un pericol pentru oameni. Licuricii, la rândul lor, comunică prin lumină, iar populațiile lor scad din cauza poluării luminoase și a pierderii habitatului.',
    ],
    faq: [
      {
        question: 'Cât de mari pot ajunge gândacii?',
        answer:
          'Variază de la câțiva milimetri până la circa 15 cm la cele mai mari specii cu corn. Măsurătorile diferă după metodă, mai ales când se include cornul.',
      },
      {
        question: 'De ce luminează licuricii?',
        answer:
          'Lumina este un semnal de curtare. Masculii emit tipare de sclipiri, iar femelele răspund. Lumina artificială perturbă acest dialog.',
      },
      {
        question: 'Sunt gândacii cu corn periculoși?',
        answer:
          'Nu. Nu mușcă și nu înțeapă. Cornul este folosit în luptele dintre masculi, iar un exemplar ridicat se poate agăța cu picioarele, dar nu produce răni.',
      },
    ],
    related: [
      { group: 'marine', blurb: 'Alte nevertebrate cu adaptări spectaculoase, de data aceasta în apă.' },
    ],
  },

  'insecte/insecte-exotice': {
    metaTitle: 'Insecte exotice: camuflaj și îngrijire',
    metaDesc:
      'Insecte exotice: insecta frunză, insecta băț și alte specii cu camuflaj. Hrană, ciclu de viață, durată de viață și cum se țin în terariu.',
    intro: [
      'Insectele exotice trăiesc mai ales în zone tropicale și sunt ținute în terarii de pasionați. Cele mai cunoscute sunt insectele frunză și insectele băț, din ordinul Phasmatodea, celebre pentru camuflajul lor.',
      'Articolele explică hrana, ciclul de viață și durata de viață a fiecărei specii, precum și condițiile de terariu: temperatură, umiditate, ventilație și frunze proaspete, fără pesticide. Unele specii se pot reproduce fără mascul, ceea ce le face ușor de întreținut.',
      'Dacă te gândești să ții astfel de insecte, cumpără doar de la crescători autorizați și nu le elibera în natură. Speciile exotice pot deveni invazive și pot dăuna plantelor locale.',
    ],
    faq: [
      {
        question: 'Cât trăiesc insectele frunză și insectele băț?',
        answer:
          'Depinde de specie, temperatură și hrană: de la câteva luni la peste un an. Femelele trăiesc, în general, mai mult decât masculii.',
      },
      {
        question: 'Ce mănâncă insectele din ordinul Phasmatodea?',
        answer:
          'Sunt vegetariene și se hrănesc cu frunze. În captivitate primesc frunze proaspete de mur, trandafir, stejar sau altele potrivite speciei, fără pesticide.',
      },
      {
        question: 'Cum se apără insectele exotice?',
        answer:
          'Mai ales prin camuflaj: stau nemișcate pe plantă și imită frunze sau crenguțe. Unele se prefac moarte sau își schimbă culoarea după mediu.',
      },
    ],
    related: [
      { group: 'marine', blurb: 'Nevertebrate marine ținute uneori în acvarii, cu alte nevoi și alte riscuri.' },
    ],
  },

  salbatice: {
    metaTitle: 'Animale sălbatice: mamifere și specii din natură',
    metaDesc:
      'Animale sălbatice explicate clar: mamifere și alte specii din natură, cu mărime, hrană, hibernare, durata de viață și statut de conservare.',
    intro: [
      'Animalele sălbatice trăiesc în natură, de la păduri și munți până la gheața arctică. Această secțiune prezintă mamifere și alte specii cu mărime, hrană, comportament, durata de viață și statut de conservare.',
      'Articolele explică și cum să te comporți în zone cu animale mari, de exemplu în ținuturi cu urși, și ce înseamnă protecția legală: aceeași specie poate fi de risc minim la nivel global și protejată într-o țară sau într-o regiune.',
      'Pentru speciile din Europa menționăm și legătura cu fauna din România, acolo unde este cazul. Cifrele despre populații și evaluările IUCN diferă între surse, așa că indicăm intervalul și trimitem la Lista Roșie.',
    ],
    faq: [
      {
        question: 'Care este diferența dintre ursul grizzly și ursul brun?',
        answer:
          'Grizzly este numele ursului brun din America de Nord. Ursul brun european face parte din aceeași specie, Ursus arctos.',
      },
      {
        question: 'Cum mă comport dacă întâlnesc un urs?',
        answer:
          'Păstrează distanța, nu te apropia de pui, nu fugi și retrage-te încet, vorbind calm. Ține mâncarea închisă și fă zgomot pe traseu, ca să nu surprinzi un urs.',
      },
      {
        question: 'De ce diferă statutul de conservare al aceleiași specii?',
        answer:
          'Evaluările pot fi globale sau regionale. O specie poate fi de risc minim la nivel global și protejată într-o zonă unde populațiile sunt mici sau izolate.',
      },
    ],
    related: [
      { group: 'marine', blurb: 'Mamifere și prădători din ocean, de la balene la rechini.' },
      { group: 'caini', blurb: 'Câinii domestici, rude îndepărtate ale prădătorilor din natură.' },
    ],
  },

  'salbatice/mamifere': {
    metaTitle: 'Mamifere sălbatice: urși și alte specii',
    metaDesc:
      'Mamifere sălbatice: ursul grizzly, ursul polar și alte specii. Mărime, hrană, hibernare, reproducere, durata de viață și conservare.',
    intro: [
      'Mamiferele sălbatice își hrănesc puii cu lapte și s-au adaptat la medii foarte diferite. Aici găsești urșii, de la grizzly, care hibernează luni de zile, până la ursul polar, care depinde de gheața marină.',
      'Pentru fiecare specie prezentăm mărimea, hrana, habitatul, reproducerea, durata de viață și statutul de conservare, cu un tabel comparativ față de specii apropiate. Menționăm și regulile de siguranță în zonele cu urși.',
      'Multe mamifere mari au populații în scădere din cauza pierderii habitatului și a schimbărilor climatice. Indicăm cifrele disponibile și arătăm unde sursele nu se potrivesc.',
    ],
    faq: [
      {
        question: 'Hibernează toți urșii?',
        answer:
          'Nu. Ursul grizzly și ursul brun hibernează câteva luni pe an, iar ursul polar de regulă nu hibernează; doar femelele gestante se adăpostesc într-o vizuină unde nasc.',
      },
      {
        question: 'Care este cel mai mare urs?',
        answer:
          'Ursul polar este cel mai mare carnivor terestru, cu masculi de circa 300–800 kg. Ursul grizzly are în general 130–360 kg, deși unele exemplare mari au fost raportate cu mult mai mult.',
      },
      {
        question: 'Sunt urșii amenințați cu dispariția?',
        answer:
          'Depinde de specie și de regiune. Ursul brun este de risc minim la nivel de specie, iar ursul polar este considerat vulnerabil, în principal din cauza topirii gheții marine.',
      },
    ],
    related: [
      { group: 'marine', blurb: 'Mamifere din ocean, de la balene la foci, hrana ursului polar.' },
    ],
  },
}

export function getCategoryContent(path: string): CategoryContent | null {
  return CATEGORY_CONTENT[path] ?? null
}

/** Completeaza metaTitle/metaDesc dintr-o categorie cu valorile editoriale, cand nu sunt setate in baza de date. */
export function withContentMeta<T extends { metaTitle: string | null; metaDesc: string | null; description: string | null }>(
  category: T,
  path: string,
): T {
  const c = getCategoryContent(path)
  if (!c) return category
  return {
    ...category,
    metaTitle: category.metaTitle ?? c.metaTitle,
    metaDesc: category.metaDesc ?? category.description ?? c.metaDesc,
  }
}
