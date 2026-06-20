// Curated learning content for the "ough" word family — a set of English words
// that look almost identical but sound and mean completely different things.
// Used by the /modules/ough-words learning module.

export type ModuleExample = {
  en: string; // English example sentence (the target word stands alone as a token)
  pt: string; // Portuguese translation of the sentence
};

export type ConfusingWord = {
  id: string;
  word: string; // English word
  respelling: string; // simple phonetic hint (the user's memory anchor)
  ipa: string; // International Phonetic Alphabet
  // Real native-speaker recording (Wikimedia Commons, via dictionaryapi.dev).
  // Plays on any OS/browser with speakers — no system TTS voices required.
  audioUrl: string;
  rhymesWith: string; // words that rhyme, to anchor the sound
  pos: string; // part of speech (in Portuguese)
  portuguese: string; // main Portuguese translation(s)
  meaning: string; // short explanation in Portuguese
  tip: string; // memory tip in Portuguese
  examples: ModuleExample[]; // examples[0] is the cleanest for fill-in-the-blank
};

// NOTE: examples[0] is intentionally chosen so the target word can be cleanly
// removed for the fill-in-the-blank quiz.
export const oughWords: ConfusingWord[] = [
  {
    id: 'tough',
    word: 'tough',
    respelling: '/taf/',
    ipa: '/tʌf/',
    audioUrl: 'https://api.dictionaryapi.dev/media/pronunciations/en/tough-us.mp3',
    rhymesWith: 'stuff, rough, enough',
    pos: 'adjetivo',
    portuguese: 'difícil / duro / resistente',
    meaning: 'Algo difícil de fazer ou de enfrentar; também algo duro ou resistente fisicamente.',
    tip: 'O "GH" soa como "F" e rima com "stuff". Pense: a vida é dura → tough /taf/.',
    examples: [
      { en: 'Learning English can be tough at first.', pt: 'Aprender inglês pode ser difícil no começo.' },
      { en: 'She is a tough negotiator.', pt: 'Ela é uma negociadora durona.' },
      { en: 'This old steak is really tough.', pt: 'Este bife velho está bem duro.' },
    ],
  },
  {
    id: 'though',
    word: 'though',
    respelling: '/dou/',
    ipa: '/ðoʊ/',
    audioUrl: 'https://api.dictionaryapi.dev/media/pronunciations/en/though-us.mp3',
    rhymesWith: 'go, no, slow',
    pos: 'conjunção / advérbio',
    portuguese: 'embora / apesar de / no entanto',
    meaning: 'Introduz um contraste ("embora"). No fim da frase, significa "no entanto / porém".',
    tip: 'O "TH" é sonoro (como em "this") e o "GH" é mudo. Soa /dou/ e rima com "go".',
    examples: [
      { en: 'Though it was late, we kept working.', pt: 'Embora fosse tarde, continuamos trabalhando.' },
      { en: "I like it. It's a bit expensive, though.", pt: 'Eu gosto. É um pouco caro, no entanto.' },
      { en: 'He smiled as though nothing had happened.', pt: 'Ele sorriu como se nada tivesse acontecido.' },
    ],
  },
  {
    id: 'through',
    word: 'through',
    respelling: '/thru/',
    ipa: '/θruː/',
    audioUrl: 'https://api.dictionaryapi.dev/media/pronunciations/en/through-1-us.mp3',
    rhymesWith: 'true, blue, new',
    pos: 'preposição / advérbio',
    portuguese: 'através de / por / do começo ao fim',
    meaning: 'Movimento de um lado ao outro de algo, ou do início ao fim de uma tarefa.',
    tip: 'Soa como "true" começando com "th". O "GH" é mudo: /thru/.',
    examples: [
      { en: 'We drove through the tunnel.', pt: 'Dirigimos através do túnel.' },
      { en: 'I read through the whole report.', pt: 'Li o relatório inteiro.' },
      { en: 'She got through the exam easily.', pt: 'Ela passou na prova facilmente.' },
    ],
  },
  {
    id: 'thought',
    word: 'thought',
    respelling: '/thot/',
    ipa: '/θɔːt/',
    audioUrl: 'https://api.dictionaryapi.dev/media/pronunciations/en/thought-us.mp3',
    rhymesWith: 'bought, caught, taught',
    pos: 'substantivo / verbo (passado de "think")',
    portuguese: 'pensamento / pensei (passado de "think")',
    meaning: 'Como substantivo: "pensamento / ideia". Como verbo: passado de "think" (pensar).',
    tip: 'Rima com "bought". É o passado de THINK: think → thought.',
    examples: [
      { en: 'I thought you were coming.', pt: 'Eu pensei que você viria.' },
      { en: "That's an interesting thought.", pt: 'Esse é um pensamento interessante.' },
      { en: 'Give it some thought before deciding.', pt: 'Pense um pouco antes de decidir.' },
    ],
  },
  {
    id: 'thorough',
    word: 'thorough',
    respelling: '/thérou/',
    ipa: '/ˈθʌroʊ/',
    audioUrl: 'https://api.dictionaryapi.dev/media/pronunciations/en/thorough-us.mp3',
    rhymesWith: 'borough (NÃO rima com "through")',
    pos: 'adjetivo',
    portuguese: 'minucioso / completo / detalhado',
    meaning: 'Feito com muito cuidado e atenção aos detalhes; completo.',
    tip: 'Tem DUAS sílabas: THÉ-rou. Não confunda com "through" (uma sílaba só).',
    examples: [
      { en: 'The police did a thorough investigation.', pt: 'A polícia fez uma investigação minuciosa.' },
      { en: 'She gave the room a thorough cleaning.', pt: 'Ela fez uma limpeza completa no quarto.' },
      { en: 'He has a thorough knowledge of the subject.', pt: 'Ele tem um conhecimento profundo do assunto.' },
    ],
  },
  {
    id: 'throughout',
    word: 'throughout',
    respelling: '/thru aut/',
    ipa: '/θruːˈaʊt/',
    audioUrl: 'https://api.dictionaryapi.dev/media/pronunciations/en/throughout-us.mp3',
    rhymesWith: 'through + out',
    pos: 'preposição / advérbio',
    portuguese: 'por todo / ao longo de / durante todo',
    meaning: 'Em todas as partes de um lugar, ou durante todo um período de tempo.',
    tip: 'É "through" + "out": /thru/ + /aut/. Ideia de "em tudo, o tempo todo".',
    examples: [
      { en: 'It rained throughout the night.', pt: 'Choveu durante toda a noite.' },
      { en: 'There are parks throughout the city.', pt: 'Há parques por toda a cidade.' },
      { en: 'She stayed calm throughout the interview.', pt: 'Ela ficou calma durante toda a entrevista.' },
    ],
  },
];
