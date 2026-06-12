"""Dictionary validation for LLM-generated distractor words.

The enrichment model is asked for distractors that are *easily confused* with
the target word. It sometimes takes that too far and invents a misspelling that
is not a real word at all -- e.g. it returned ``"hopefuly"`` and ``"hopfully"``
as distractors for ``"hopefully"``. Teaching a learner a misspelling as if it
were a word defeats the purpose of the flashcards.

``EnglishWordValidator`` answers one question: *is this generated term a real
English word (or a multi-word expression made of real words)?* Enrichment uses
it to drop non-dictionary distractors and replace them with known-good fallback
words, so ``vocab.json`` only ever contains real English.

The backing dictionary is provided by the optional ``pyspellchecker`` package.
If it cannot be imported the validator *fails open* (treats every term as
valid) and logs a warning, so a missing optional dependency can never block
generation -- it only disables the extra safety net.
"""

from __future__ import annotations

import logging
import re
from collections.abc import Iterable
from functools import lru_cache
from typing import Protocol, runtime_checkable

logger = logging.getLogger(__name__)

# Alphabetic tokens, keeping internal apostrophes so contractions and
# possessives survive ("who's", "o'clock", "gotcha's"). Punctuation that joins
# multi-word distractors ("so far, so bad", "I got it!") is treated as a
# separator, which is exactly what we want when checking each word in turn.
_TOKEN_RE = re.compile(r"[a-z]+(?:'[a-z]+)*")

# The only one-letter strings that are real English words. Everything else of
# length one is rejected so stray letters never count as valid.
_SINGLE_LETTER_WORDS: frozenset[str] = frozenset({"a", "i"})

# Real terms a general-purpose frequency dictionary may not list but which are
# perfectly good flashcard distractors (interjections / slang the learner is
# explicitly studying). Kept intentionally small and easy to extend.
_DEFAULT_EXTRA_VALID: frozenset[str] = frozenset(
    {
        "gotcha",
        "gotchas",
        "yikes",
        "gosh",
        "okay",
    }
)

# Sentinel meaning "no explicit lexicon was supplied, resolve the default lazily
# on first use". ``None`` is reserved for "dictionary unavailable / disabled".
_UNSET: object = object()


@runtime_checkable
class Lexicon(Protocol):
    """Minimal interface the validator needs from a word list: membership."""

    def __contains__(self, word: str) -> bool:  # pragma: no cover - protocol
        ...


class _SpellCheckerLexicon:
    """Adapt ``pyspellchecker``'s ``SpellChecker`` to a membership test."""

    def __init__(self, spell: object) -> None:
        # ``known([w])`` returns the subset of inputs present in the dictionary.
        self._known = spell.known  # type: ignore[attr-defined]

    def __contains__(self, word: str) -> bool:
        return bool(self._known([word]))


@lru_cache(maxsize=1)
def _default_lexicon() -> Lexicon | None:
    """Load the bundled English dictionary once, or ``None`` if unavailable."""
    try:
        from spellchecker import SpellChecker
    except Exception as exc:  # pragma: no cover - exercised only without the dep
        logger.warning(
            "pyspellchecker is unavailable (%s); generated distractor words will "
            "NOT be dictionary-checked. Install it with `uv sync` to enable the "
            "spelling safety net.",
            exc,
        )
        return None
    return _SpellCheckerLexicon(SpellChecker(distance=1))


class EnglishWordValidator:
    """Validate that a generated term is a real English word or expression.

    A term is valid when *every* alphabetic token it contains is a known
    English word, so single words ("helpful") and multi-word expressions
    ("come over", "so far so good") are both handled. Made-up inflections such
    as "broughts" are rejected because the invented token itself is not in the
    dictionary, even though its stem "brought" is.

    Parameters
    ----------
    lexicon:
        A membership-testable word list. Defaults to the bundled
        ``pyspellchecker`` dictionary, loaded lazily on first use. Pass an
        explicit set/lexicon in tests to stay deterministic and fast, or pass
        ``None`` to force the fail-open (disabled) behaviour.
    extra_valid:
        Extra terms to always treat as valid, merged with the built-in
        allow-list of app-relevant slang/interjections.
    """

    def __init__(
        self,
        lexicon: Lexicon | None | object = _UNSET,
        *,
        extra_valid: Iterable[str] = (),
    ) -> None:
        self._lexicon = lexicon
        self._extra_valid = {
            term.strip().lower() for term in extra_valid if term.strip()
        } | _DEFAULT_EXTRA_VALID

    @property
    def enabled(self) -> bool:
        """True when a backing dictionary is available to check words against."""
        return self._resolve_lexicon() is not None

    def is_valid_word(self, word: str) -> bool:
        """Alias for :meth:`is_valid_term`; reads naturally for single words."""
        return self.is_valid_term(word)

    def is_valid_term(self, term: str) -> bool:
        """Return True when every word in ``term`` is a real English word.

        When the dictionary is unavailable this returns ``True`` for any
        non-empty term (fail open) so generation is never blocked by a missing
        optional dependency.
        """
        if not isinstance(term, str):
            return False
        tokens = _TOKEN_RE.findall(term.lower())
        if not tokens:
            return False
        lexicon = self._resolve_lexicon()
        if lexicon is None:
            return True
        return all(self._is_valid_token(token, lexicon) for token in tokens)

    def _resolve_lexicon(self) -> Lexicon | None:
        if self._lexicon is _UNSET:
            self._lexicon = _default_lexicon()
        return self._lexicon  # type: ignore[return-value]

    def _is_valid_token(self, token: str, lexicon: Lexicon) -> bool:
        if token in self._extra_valid:
            return True
        if len(token) == 1:
            return token in _SINGLE_LETTER_WORDS
        if token in lexicon:
            return True
        # Accept a possessive of a known noun ("gotcha's" -> "gotcha") without
        # accepting invented plurals/inflections ("broughts" stays rejected).
        if token.endswith("'s") and len(token) > 2 and token[:-2] in lexicon:
            return True
        return False
