import unittest

from agent.enrichers import _coerce_word_entry, _fallback_pronuncia
from agent.parser import RawWord
from agent.pronunciation import is_english_spelling_echo


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


if __name__ == "__main__":
    unittest.main()
