"""Brazilian-Portuguese-friendly English pronunciation helpers.

The LLM usually produces good pronunciations, but it occasionally echoes the
English spelling. These helpers provide a deterministic safety net so generated
`pronuncia` values stay readable by Portuguese speakers.
"""

from __future__ import annotations

import re


_WORD_OVERRIDES: dict[str, str] = {
    "a": "â",
    "about": "â-báut",
    "across": "â-krós",
    "actually": "ék-shu-a-li",
    "another": "â-nâ-dâr",
    "are": "ár",
    "as": "éz",
    "at": "át",
    "away": "â-uêi",
    "aware": "â-uér",
    "back": "bék",
    "bad": "béd",
    "batch": "bétch",
    "beach": "bítch",
    "become": "bi-kâm",
    "bed": "béd",
    "besides": "bi-sáidz",
    "bet": "bét",
    "boat": "bôut",
    "both": "bôuf",
    "bought": "bót",
    "breakthrough": "brêik-frú",
    "brought": "brót",
    "brush": "brâsh",
    "came": "kêim",
    "claiming": "klêi-ming",
    "come": "kâm",
    "coming": "kâ-ming",
    "complained": "kôm-pleind",
    "despite": "dis-páit",
    "due": "dú",
    "fact": "fékt",
    "fairly": "fér-li",
    "far": "fár",
    "further": "fâr-dâr",
    "get": "gét",
    "glimpse": "glímps",
    "goofing": "gú-fing",
    "got": "gát",
    "gotcha": "gát-cha",
    "gotchas": "gát-chas",
    "helpful": "hélp-ful",
    "hope": "hôup",
    "hopefully": "hôup-fu-li",
    "how": "háu",
    "i": "ái",
    "if": "íf",
    "in": "ín",
    "instead": "in-stéd",
    "it": "ít",
    "late": "lêit",
    "least": "líst",
    "look": "lúk",
    "made": "mêid",
    "meantime": "mín-taim",
    "mend": "ménd",
    "mind": "máind",
    "mine": "máin",
    "my": "mái",
    "never": "né-vâr",
    "no": "nôu",
    "of": "âv",
    "off": "óf",
    "out": "áut",
    "over": "ôu-vâr",
    "pays": "pêiz",
    "pitty": "pí-ti",
    "pity": "pí-ti",
    "playful": "plêi-ful",
    "prettier": "prí-ti-âr",
    "pretty": "prí-ti",
    "quite": "kuáit",
    "quiet": "kuái-et",
    "quit": "kuít",
    "rail": "rêil",
    "rather": "rá-dâr",
    "real": "rí-al",
    "regarding": "ri-gár-ding",
    "relies": "ri-láiz",
    "rider": "rái-dâr",
    "role": "rôul",
    "roll": "rôul",
    "rule": "rúl",
    "seemed": "símd",
    "since": "síns",
    "soon": "sún",
    "sort": "sórt",
    "strict": "stríkt",
    "the": "dâ",
    "their": "dér",
    "there": "dér",
    "therefore": "dér-fór",
    "they're": "dér",
    "thorough": "fâ-rou",
    "though": "dôu",
    "thought": "fót",
    "through": "frú",
    "throughout": "fru-áut",
    "throw": "frôu",
    "to": "tu",
    "tough": "tâf",
    "very": "vé-ri",
    "wake": "uêik",
    "way": "uêi",
    "wear": "uér",
    "weather": "ué-dâr",
    "weird": "uírd",
    "where": "uér",
    "whether": "ué-dâr",
    "whoose": "húz",
    "whose": "húz",
    "wild": "uáild",
    "with": "uíd",
    "word": "uârd",
    "worth": "uârf",
    "what": "uát",
    "you": "iú",
}

_PHRASE_OVERRIDES: dict[str, str] = {
    "as if": "éz íf",
    "brush up": "brâsh áp",
    "come over": "kâm ôu-vâr",
    "come to": "kâm tu",
    "coming soon": "kâ-ming sún",
    "due to": "dú tu",
    "get a glimpse": "gét â glímps",
    "goofing off": "gú-fing óf",
    "how come": "háu kâm",
    "i got it": "ái gát ít",
    "in fact": "ín fékt",
    "in the meantime": "ín dâ mín-taim",
    "instead of": "in-stéd âv",
    "look out": "lúk áut",
    "my bad": "mái béd",
    "never mind": "né-vâr máind",
    "no way": "nôu uêi",
    "pays off": "pêiz óf",
    "pretty late": "prí-ti lêit",
    "pretty soon": "prí-ti sún",
    "so far so good": "sô fár sô gúd",
    "sort of": "sórt âv",
    "throw away": "frôu â-uêi",
    "very soon": "vé-ri sún",
    "wake up": "uêik áp",
    "what a pitty": "uát â pí-ti",
    "what a pity": "uát â pí-ti",
    "you bet": "iú bét",
}

_TOKEN_RE = re.compile(r"[A-Za-z']+")


def coerce_pronuncia(english: str, value: object) -> str:
    """Return a usable pronunciation, replacing empty values or English echoes."""
    if isinstance(value, str) and value.strip():
        pronuncia = value.strip()
        if not is_english_spelling_echo(english, pronuncia):
            return pronuncia
    return to_portuguese_phonetic(english)


def is_english_spelling_echo(english: str, pronuncia: str) -> bool:
    """Detect `pronuncia` values that merely repeat the English spelling."""
    english_key = _echo_key(english)
    pronuncia_key = _echo_key(pronuncia)
    return bool(english_key) and english_key == pronuncia_key


def to_portuguese_phonetic(english: str) -> str:
    """Approximate English pronunciation using Portuguese-readable spelling."""
    key = _phrase_key(english)
    if key in _PHRASE_OVERRIDES:
        return _PHRASE_OVERRIDES[key]

    tokens = _TOKEN_RE.findall(english.lower())
    if not tokens:
        return english.strip().lower() or "term"

    return " ".join(_transcribe_word(token) for token in tokens)


def _transcribe_word(word: str) -> str:
    if word in _WORD_OVERRIDES:
        return _WORD_OVERRIDES[word]

    result = word
    replacements: tuple[tuple[str, str], ...] = (
        ("eigh", "êi"),
        ("igh", "ái"),
        ("air", "ér"),
        ("are", "ér"),
        ("ear", "ír"),
        ("ee", "í"),
        ("ea", "í"),
        ("oo", "ú"),
        ("oa", "ôu"),
        ("ou", "áu"),
        ("ow", "áu"),
        ("ai", "êi"),
        ("ay", "êi"),
        ("ey", "êi"),
        ("oy", "ói"),
        ("oi", "ói"),
        ("tion", "shân"),
        ("sion", "jân"),
        ("tch", "tch"),
        ("ch", "tch"),
        ("sh", "sh"),
        ("ph", "f"),
        ("th", "f"),
        ("wh", "u"),
        ("qu", "ku"),
        ("ck", "k"),
        ("x", "ks"),
    )
    for source, target in replacements:
        result = result.replace(source, target)

    result = re.sub(r"c([eiy])", r"s\1", result)
    result = result.replace("c", "k")
    result = re.sub(r"g([eiy])", r"j\1", result)
    result = re.sub(r"er$", "âr", result)
    result = re.sub(r"or$", "ôr", result)
    result = re.sub(r"y$", "i", result)

    if is_english_spelling_echo(word, result):
        result = _accent_first_vowel(result)
    return result


def _phrase_key(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().lower())


def _echo_key(value: str) -> str:
    return "".join(char for char in value.strip().lower() if char.isalnum())


def _accent_first_vowel(value: str) -> str:
    accent_map = {
        "a": "á",
        "e": "é",
        "i": "í",
        "o": "ó",
        "u": "ú",
        "y": "í",
    }
    for index, char in enumerate(value):
        if char in accent_map:
            return value[:index] + accent_map[char] + value[index + 1 :]
    return value
