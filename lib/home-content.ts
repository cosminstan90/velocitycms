/**
 * Textele statice ale homepage-ului DiVet. Sunt intr-un singur loc, ca blocul vizibil de
 * intrebari frecvente si schema FAQPage sa spuna intotdeauna exact acelasi lucru.
 */

export const HOME_FAQ: ReadonlyArray<{ question: string; answer: string }> = [
  {
    question: 'Ce este DiVet?',
    answer:
      'DiVet este o enciclopedie în limba română despre animale: rase de câini și pisici, specii sălbatice, animale marine și insecte. Fiecare articol are un rezumat, specificații, întrebări frecvente și, acolo unde ajută, comparații cu specii apropiate.',
  },
  {
    question: 'Ce găsesc într-un articol DiVet?',
    answer:
      'Fiecare articol începe cu un rezumat scurt, apoi prezintă originea, aspectul, temperamentul, îngrijirea, alimentația și sănătatea. Datele numerice, cum sunt greutatea sau speranța de viață, sunt grupate într-un tabel de specificații și sunt însoțite de surse sau de menționarea diferențelor dintre ele.',
  },
  {
    question: 'Cât de des se adaugă articole noi?',
    answer:
      'Enciclopedia se completează în mod regulat, cu articole noi publicate în fiecare zi. Pagina fiecărui articol arată data ultimei actualizări, iar secțiunea „Adăugate recent” de pe prima pagină listează cele mai noi articole.',
  },
  {
    question: 'Pot înlocui sfatul medicului veterinar cu informațiile de pe DiVet?',
    answer:
      'Nu. Articolele au rol informativ și te ajută să înțelegi o rasă sau o specie, dar nu înlocuiesc consultul veterinar. Pentru simptome, tratamente sau decizii de sănătate, mergi la un medic veterinar.',
  },
]

export const HOME_INTRO =
  'Articole structurate despre câini, pisici, animale marine, insecte și specii sălbatice: origine, aspect, temperament, îngrijire și sănătate, cu specificații clare și comparații între specii apropiate.'
