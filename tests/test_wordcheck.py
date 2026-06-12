import unittest

from agent.wordcheck import EnglishWordValidator


# A tiny deterministic lexicon so these tests never depend on the bundled
# dictionary's exact contents. ``set`` already supports ``in`` membership.
_LEXICON = {
    "hope",
    "hopeful",
    "hopelessly",
    "helpful",
    "come",
    "over",
    "so",
    "far",
    "good",
    "dog",
    "apple",
    "sky",
}


class IsValidTermTests(unittest.TestCase):
    def setUp(self) -> None:
        self.validator = EnglishWordValidator(_LEXICON)

    def test_real_single_word_is_valid(self) -> None:
        self.assertTrue(self.validator.is_valid_word("hopeful"))
        self.assertTrue(self.validator.is_valid_word("Helpful"))  # case-insensitive

    def test_invented_misspellings_are_invalid(self) -> None:
        self.assertFalse(self.validator.is_valid_word("hopefuly"))
        self.assertFalse(self.validator.is_valid_word("hopfully"))

    def test_multi_word_expression_valid_when_all_words_known(self) -> None:
        self.assertTrue(self.validator.is_valid_term("come over"))
        self.assertTrue(self.validator.is_valid_term("so far so good"))

    def test_multi_word_expression_invalid_when_any_word_unknown(self) -> None:
        self.assertFalse(self.validator.is_valid_term("come zzz"))

    def test_punctuation_between_words_is_ignored(self) -> None:
        self.assertTrue(self.validator.is_valid_term("so far, so good"))

    def test_possessive_of_known_noun_is_valid(self) -> None:
        self.assertTrue(self.validator.is_valid_term("dog's"))

    def test_invented_plural_of_known_word_is_rejected(self) -> None:
        # "good" is known but "goods" is a different token and not in the
        # lexicon, so a fabricated plural must not slip through.
        self.assertFalse(self.validator.is_valid_word("goods"))

    def test_single_letter_words(self) -> None:
        self.assertTrue(self.validator.is_valid_term("a"))
        self.assertTrue(self.validator.is_valid_term("I"))
        self.assertFalse(self.validator.is_valid_term("z"))

    def test_empty_and_non_alphabetic_terms_are_invalid(self) -> None:
        self.assertFalse(self.validator.is_valid_term(""))
        self.assertFalse(self.validator.is_valid_term("   "))
        self.assertFalse(self.validator.is_valid_term("123"))
        self.assertFalse(self.validator.is_valid_term(None))  # type: ignore[arg-type]

    def test_builtin_allow_list_covers_app_slang(self) -> None:
        # "gotcha" is in the default allow-list even if absent from the lexicon.
        self.assertTrue(self.validator.is_valid_word("gotcha"))

    def test_extra_valid_terms_are_accepted(self) -> None:
        validator = EnglishWordValidator(_LEXICON, extra_valid=["zzz"])
        self.assertTrue(validator.is_valid_word("zzz"))


class DisabledValidatorTests(unittest.TestCase):
    """When no dictionary is available the validator fails open."""

    def setUp(self) -> None:
        self.validator = EnglishWordValidator(None)

    def test_not_enabled_without_lexicon(self) -> None:
        self.assertFalse(self.validator.enabled)

    def test_fails_open_for_any_non_empty_term(self) -> None:
        self.assertTrue(self.validator.is_valid_word("hopefuly"))

    def test_still_rejects_empty_terms(self) -> None:
        self.assertFalse(self.validator.is_valid_term(""))


class RealDictionarySmokeTests(unittest.TestCase):
    """Exercise the bundled pyspellchecker dictionary when it is installed."""

    def setUp(self) -> None:
        self.validator = EnglishWordValidator()
        if not self.validator.enabled:
            self.skipTest("pyspellchecker not installed; dictionary disabled")

    def test_accepts_real_words_and_rejects_the_reported_misspelling(self) -> None:
        self.assertTrue(self.validator.is_valid_word("hopefully"))
        self.assertFalse(self.validator.is_valid_word("hopefuly"))

    def test_rejects_other_observed_non_words(self) -> None:
        for non_word in ("hopfully", "acheive", "prettend", "broughts", "oclock"):
            self.assertFalse(
                self.validator.is_valid_word(non_word),
                msg=f"expected {non_word!r} to be rejected",
            )


if __name__ == "__main__":
    unittest.main()
