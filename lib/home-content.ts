/**
 * Textele statice ale homepage-ului DiVet. Sunt intr-un singur loc, ca blocul vizibil de
 * intrebari frecvente si schema FAQPage sa spuna intotdeauna exact acelasi lucru.
 */

export const HOME_FAQ: ReadonlyArray<{ question: string; answer: string }> = [
  {
    question: 'Ce este DiVet?',
    answer:
      'DiVet este o enciclopedie în limba română despre animale: rase de câini și pisici, specii sălbatice, animale marine și insecte. Fiecare fișă are un rezumat, specificații, întrebări frecvente și, acolo unde ajută, comparații cu specii apropiate.',
  },
  {
    question: 'Ce găsesc într-o fișă DiVet?',
    answer:
      'Fiecare fișă începe cu un rezumat scurt, apoi prezintă originea, aspectul, temperamentul, îngrijirea, alimentația și sănătatea. Datele numerice, cum sunt greutatea sau speranța de viață, sunt grupate într-un tabel de specificații și sunt însoțite de surse sau de menționarea diferențelor dintre ele.',
  },
  {
    question: 'Cât de des se adaugă fișe noi?',
    answer:
      'Enciclopedia se completează în mod regulat, cu fișe noi publicate în fiecare zi. Pagina fiecărei fișe arată data ultimei actualizări, iar secțiunea „Adăugate recent” de pe prima pagină listează cele mai noi intrări.',
  },
  {
    question: 'Pot înlocui sfatul medicului veterinar cu informațiile de pe DiVet?',
    answer:
      'Nu. Fișele au rol informativ și te ajută să înțelegi o rasă sau o specie, dar nu înlocuiesc consultul veterinar. Pentru simptome, tratamente sau decizii de sănătate, mergi la un medic veterinar.',
  },
]

export const HOME_INTRO =
  'Fișe structurate despre câini, pisici, animale marine, insecte și specii sălbatice: origine, aspect, temperament, îngrijire și sănătate, cu specificații clare și comparații între specii apropiate.'
