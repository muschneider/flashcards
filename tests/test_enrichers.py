import unittest

from agent.enrichers import (
    _align_items,
    _chunked,
    _coerce_sentence_entry,
    _coerce_word_entry,
    _fallback_pronuncia,
)
from agent.parser import RawSentence, RawWord
from agent.pronunciation import is_english_spelling_echo
from agent.wordcheck import EnglishWordValidator


class PronunciaFallbackTests(unittest.TestCase):
    def test_fallback_pronuncia_uses_portuguese_phonetics_for_phrase(self) -> None:
        self.assertEqual(_fallback_pronuncia("pretty soon"), "prí-ti sún")
        self.assertEqual(_fallback_pronuncia("rider"), "rái-dâr")

    def test_echo_detection_allows_accented_phonetics(self) -> None:
        self.assertFalse(is_english_spelling_echo("mind", "máind"))
        self.assertTrue(is_english_spelling_echo("pretty soon", "pretty-soon"))

    def test_coerce_word_entry_replaces_english_echo_pronuncias(self) -> None:
        entry = _coerce_word_entry(
            raw=RawWord(english="pretty soon", portuguese="em breve"),
            item={
                "pronuncia": "pretty soon",
                "tipo": "expression",
                "example": "I will call you pretty soon.",
                "random_words": [
                    {"word": "very soon", "pronuncia": "very soon"},
                    {"word": "pretty late", "pronuncia": "pretty late"},
                    "coming soon",
                    {"word": "soon", "pronuncia": "soon"},
                    {"word": "prettier", "pronuncia": "prettier"},
                ],
            },
            source_terms=["pretty soon"],
        )

        self.assertEqual(entry.pronuncia, "prí-ti sún")
        self.assertEqual(entry.random_words[0].pronuncia, "vé-ri sún")
        self.assertEqual(entry.random_words[2].pronuncia, "kâ-ming sún")
        self.assertTrue(
            all(
                random_word.pronuncia.lower() != random_word.word.lower()
                for random_word in entry.random_words
            )
        )

    def test_coerce_word_entry_discards_item_tagged_for_another_word(self) -> None:
        """Metadata echoing a different english must never be applied."""
        entry = _coerce_word_entry(
            raw=RawWord(english="enemies", portuguese="inimigos"),
            item={
                # This object belongs to "brave" -- it must be ignored entirely.
                "index": 84,
                "english": "brave",
                "pronuncia": "bréiv",
                "tipo": "adjective",
                "example": "He was brave in battle.",
                "random_words": [
                    {"word": "brave", "pronuncia": "bréiv"},
                    {"word": "bride", "pronuncia": "bráid"},
                    {"word": "grave", "pronuncia": "grêiv"},
                    {"word": "brake", "pronuncia": "brêik"},
                    {"word": "rave", "pronuncia": "rêiv"},
                ],
            },
            source_terms=["enemy", "enemies", "brave", "groom", "afraid", "bride"],
        )

        self.assertEqual(entry.english, "enemies")
        self.assertNotEqual(entry.pronuncia, "bréiv")
        self.assertNotEqual(entry.tipo, "adjective")
        self.assertNotEqual(entry.example, "He was brave in battle.")
        distractor_words = {rw.word.lower() for rw in entry.random_words}
        self.assertNotIn("brave", distractor_words)
        self.assertEqual(len(entry.random_words), 5)


class DistractorDictionaryFilterTests(unittest.TestCase):
    """Generated distractors must be real English words, not invented spellings."""

    def test_non_dictionary_distractors_are_dropped_and_backfilled(self) -> None:
        validator = EnglishWordValidator(
            {"hopeful", "hopelessly", "helpful"}
        )
        entry = _coerce_word_entry(
            raw=RawWord(english="hopefully", portuguese="tomara"),
            item={
                "pronuncia": "hôup-fu-li",
                "tipo": "adverb",
                "example": "Hopefully it works.",
                "random_words": [
                    {"word": "hopeful", "pronuncia": "hôup-ful"},
                    {"word": "hopelessly", "pronuncia": "hôup-lés-li"},
                    {"word": "hopefuly", "pronuncia": "hôup-fu-li"},
                    {"word": "hopfully", "pronuncia": "hôup-fu-li"},
                    {"word": "helpful", "pronuncia": "hélp-ful"},
                ],
            },
            source_terms=["hopefully"],
            validator=validator,
        )

        words = {rw.word.lower() for rw in entry.random_words}
        self.assertEqual(len(entry.random_words), 5)
        self.assertNotIn("hopefuly", words)
        self.assertNotIn("hopfully", words)
        self.assertIn("hopeful", words)
        self.assertIn("helpful", words)
        self.assertIn("hopelessly", words)

    def test_curated_fallbacks_fill_in_when_validator_rejects_everything(self) -> None:
        """Even a maximally strict validator must still yield five distractors."""
        validator = EnglishWordValidator(frozenset())
        entry = _coerce_word_entry(
            raw=RawWord(english="role", portuguese="papel"),
            item={
                "pronuncia": "rôul",
                "tipo": "noun",
                "example": "She played a role.",
                "random_words": [
                    {"word": "rolle", "pronuncia": "ról"},
                    {"word": "roul", "pronuncia": "rúl"},
                ],
            },
            source_terms=["role"],
            validator=validator,
        )

        words = {rw.word.lower() for rw in entry.random_words}
        self.assertEqual(len(entry.random_words), 5)
        self.assertNotIn("rolle", words)
        self.assertNotIn("roul", words)

    def test_sentence_distractors_drop_non_words(self) -> None:
        validator = EnglishWordValidator({"apple"})
        entry = _coerce_sentence_entry(
            RawSentence(english="The cat sleeps", portuguese="O gato dorme"),
            {"random_words": "apple, zzzz"},
            0,
            validator=validator,
        )

        parts = [piece.strip().lower() for piece in entry.random_words.split(",")]
        self.assertEqual(len(parts), 2)
        self.assertNotIn("zzzz", parts)
        self.assertIn("apple", parts)


class AlignItemsTests(unittest.TestCase):
    """Model output must be matched to source entries by identity, not position."""

    def _word_item(self, index: int, english: str) -> dict:
        return {
            "index": index,
            "english": english,
            "pronuncia": f"pron-{english}",
            "tipo": "noun",
            "example": f"This is {english}.",
            "random_words": [],
        }

    def test_dropped_item_does_not_shift_neighbours(self) -> None:
        """Reproduces the reported bug: a dropped word must not steal a neighbour's data."""
        raws = [
            RawWord(english="groom", portuguese="noivo"),
            RawWord(english="enemies", portuguese="inimigos"),
            RawWord(english="brave", portuguese="corajoso"),
            RawWord(english="afraid", portuguese="com medo"),
        ]
        # The model dropped "groom" and renumbered the remaining items 1..3,
        # but still echoed each item's own english term.
        items = [
            self._word_item(1, "enemies"),
            self._word_item(2, "brave"),
            self._word_item(3, "afraid"),
        ]

        aligned = _align_items(raws, items, label="word")

        self.assertEqual(aligned[0], {})  # groom -> deterministic local fallback
        self.assertEqual(aligned[1]["english"], "enemies")
        self.assertEqual(aligned[2]["english"], "brave")
        self.assertEqual(aligned[3]["english"], "afraid")

    def test_shuffled_items_realign_by_english(self) -> None:
        raws = [
            RawWord(english="enemies", portuguese="inimigos"),
            RawWord(english="brave", portuguese="corajoso"),
            RawWord(english="afraid", portuguese="com medo"),
        ]
        items = [
            self._word_item(99, "afraid"),
            self._word_item(7, "enemies"),
            self._word_item(42, "brave"),
        ]

        aligned = _align_items(raws, items, label="word")

        self.assertEqual([item["english"] for item in aligned], ["enemies", "brave", "afraid"])

    def test_falls_back_to_index_then_position_without_english_echo(self) -> None:
        raws = [
            RawWord(english="alpha", portuguese="a"),
            RawWord(english="beta", portuguese="b"),
        ]
        # No english echo at all: legacy/degraded model output aligns by index.
        items = [
            {"index": 1, "pronuncia": "x", "tipo": "noun", "example": "x", "random_words": []},
            {"index": 2, "pronuncia": "y", "tipo": "noun", "example": "y", "random_words": []},
        ]

        aligned = _align_items(raws, items, label="word")

        self.assertEqual(aligned[0]["pronuncia"], "x")
        self.assertEqual(aligned[1]["pronuncia"], "y")

    def test_conflicting_positional_item_is_rejected(self) -> None:
        raws = [RawWord(english="alpha", portuguese="a")]
        # Only item present clearly belongs to another word -> no trustworthy match.
        items = [self._word_item(1, "omega")]

        aligned = _align_items(raws, items, label="word")

        self.assertEqual(aligned[0], {})


class ChunkedTests(unittest.TestCase):
    def test_chunks_preserve_order_and_size(self) -> None:
        self.assertEqual(_chunked([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]])

    def test_chunk_size_floor_is_one(self) -> None:
        self.assertEqual(_chunked([1, 2], 0), [[1], [2]])


if __name__ == "__main__":
    unittest.main()
