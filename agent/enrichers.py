"""LLM-powered batch enrichment of raw words and sentences.

The expensive OpenRouter work is intentionally limited to two calls per run:
one call enriches every parsed word, and one call enriches every parsed
sentence. Model output is parsed leniently and normalized locally so malformed
items do not require per-word repair calls.
"""

from __future__ import annotations

import json
import logging
import re
from collections.abc import Sequence
from difflib import SequenceMatcher
from typing import Any

from json_repair import repair_json
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable

from agent.parser import RawSentence, RawWord
from agent.pronunciation import coerce_pronuncia, to_portuguese_phonetic
from agent.schemas import (
    RandomWord,
    SentenceBatchGeneration,
    SentenceEntry,
    WordBatchGeneration,
    WordEntry,
)

logger = logging.getLogger(__name__)

_WORD_BATCH_PARSER = PydanticOutputParser(pydantic_object=WordBatchGeneration)
_SENTENCE_BATCH_PARSER = PydanticOutputParser(pydantic_object=SentenceBatchGeneration)

_WORD_FALLBACK_BANK: tuple[str, ...] = (
    "role",
    "rule",
    "roll",
    "real",
    "rail",
    "quiet",
    "quite",
    "quit",
    "quote",
    "thought",
    "though",
    "through",
    "thorough",
    "bought",
    "brought",
    "boat",
    "both",
    "weather",
    "whether",
    "where",
    "wear",
    "there",
    "their",
    "they're",
    "come",
    "coming",
    "came",
    "become",
    "mind",
    "mine",
    "mend",
    "made",
    "bad",
    "bed",
    "bet",
    "bit",
    "beach",
    "bitch",
    "bench",
    "batch",
    "hope",
    "hoping",
    "hopefully",
    "helpful",
)

_WORD_BATCH_SYSTEM = """You are an expert American-English teacher who tutors
Brazilian Portuguese speakers. Your job is to enrich vocabulary entries that
will feed a flashcard app.

You will receive a JSON array of input words. Return one generated object for
each input word, preserving the exact input order. If there are 68 input words,
the top-level items array must contain exactly 68 objects.

Rules you MUST follow for each generated object:
- "pronuncia" is the phonetic spelling written so a Brazilian-Portuguese reader
  can pronounce the word correctly out loud. Use hyphens between syllables.
  Examples: "whose" -> "rúz", "at least" -> "át líst", "rather" -> "rá-dâr",
  "bought" -> "bót", "thorough" -> "fâ-rou".
- "tipo" is the grammatical role written in lowercase English. Use one or a
  combination of: noun, verb, adjective, adverb, preposition, conjunction,
  pronoun, expression, idiom, phrasal verb, slang, interjection. Combine with
  "/" when the word straddles categories, e.g. "adjective/noun".
- "example" is ONE short, natural English sentence, 4-12 words, that uses the
  target word in context. Do NOT include the Portuguese translation.
- "random_words" must be EXACTLY 5 distractor entries that a learner could
  confuse with the target word: similar spelling, homophones, near-rhymes or
  close meaning.
- Never include the target word itself as one of its random_words. For a
  multi-word expression, never repeat the full expression as a distractor.
- The five distractors MUST all be DIFFERENT English terms.
- Each distractor must include both "word" and "pronuncia".

Return compact JSON only. No prose, no markdown."""

_WORD_BATCH_HUMAN = """Input words JSON:
{items_json}

{format_instructions}"""

_SENTENCE_BATCH_SYSTEM = """You generate distractor words for a flashcard app
that asks learners to assemble English sentences from word tiles.

You will receive a JSON array of input sentences. Return one generated object
for each input sentence, preserving the exact input order. If there are 15 input
sentences, the top-level items array must contain exactly 15 objects.

Rules you MUST follow for each generated object:
- "random_words" is exactly TWO English words separated by ", " (comma and
  space).
- Pick common, simple words: nouns, verbs, adjectives or short prepositions.
- BOTH words MUST be absent from the English sentence, case-insensitive,
  ignoring punctuation, plurals and possessives.
- The two distractors must be different English words.
- Do not invent multi-word distractors and do not return more than two words.
- Use the "theme" field from each input item to choose varied, concrete words.
  Avoid repeating the same pair across different sentences.

Return compact JSON only. No prose, no markdown."""

_SENTENCE_BATCH_HUMAN = """Input sentences JSON:
{items_json}

{format_instructions}"""

_SENTENCE_CATEGORIES: tuple[str, ...] = (
    "animals: fox, whale, sparrow, panda",
    "food and drink: bread, soup, mango, pasta",
    "household objects: lamp, sponge, mirror, blanket",
    "nature scenery: forest, river, canyon, meadow",
    "vehicles: bike, train, sailboat, kite",
    "weather phenomena: storm, breeze, frost, drizzle",
    "tools: hammer, ruler, wrench, brush",
    "clothing: scarf, hoodie, glove, sneaker",
    "body parts: elbow, ankle, palm, jaw",
    "musical instruments: drum, flute, violin, banjo",
    "stationery: eraser, marker, notebook, ribbon",
    "colours: crimson, indigo, teal, mustard",
    "geographical places: island, desert, valley, harbor",
    "emotions: joy, calm, hope, envy",
    "kitchen items: pot, kettle, blender, spatula",
    "garden plants: rose, ivy, basil, oak",
    "sports gear: racket, helmet, skate, baton",
    "shapes: circle, square, diamond, oval",
    "office supplies: stapler, folder, paperclip, envelope",
    "celestial bodies: comet, nebula, asteroid, galaxy",
)


def _word_batch_prompt() -> ChatPromptTemplate:
    return ChatPromptTemplate.from_messages(
        [("system", _WORD_BATCH_SYSTEM), ("human", _WORD_BATCH_HUMAN)]
    ).partial(format_instructions=_WORD_BATCH_PARSER.get_format_instructions())


def _sentence_batch_prompt() -> ChatPromptTemplate:
    return ChatPromptTemplate.from_messages(
        [("system", _SENTENCE_BATCH_SYSTEM), ("human", _SENTENCE_BATCH_HUMAN)]
    ).partial(format_instructions=_SENTENCE_BATCH_PARSER.get_format_instructions())


def _word_token_bag(text: str) -> set[str]:
    """Return a normalized bag of word tokens used to detect collisions."""
    bag: set[str] = set()
    for token in re.findall(r"[A-Za-z']+", text.lower()):
        token = token.strip("'")
        if not token:
            continue
        bag.add(token)
        if token.endswith("s") and len(token) > 3:
            bag.add(token[:-1])
        if token.endswith("ing") and len(token) > 4:
            bag.add(token[:-3])
        if token.endswith("ed") and len(token) > 3:
            bag.add(token[:-2])
    return bag


def _normalize_term(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().lower())


class EnrichmentError(RuntimeError):
    """Raised when an enrichment cannot be produced or validated."""


class WordEnricher:
    """Generates LLM metadata for all word entries in one model call."""

    def __init__(self, llm: BaseChatModel) -> None:
        self._chain: Runnable = _word_batch_prompt() | llm

    def enrich_many(self, raws: Sequence[RawWord]) -> list[WordEntry]:
        if not raws:
            return []

        logger.info("enriching %d words with one LLM call", len(raws))
        payload = _invoke_json_batch(self._chain, _word_inputs_json(raws), "word")
        items = _extract_items(payload, "word")
        if len(items) != len(raws):
            logger.warning(
                "word batch count mismatch: expected %d, got %d; filling missing locally",
                len(raws),
                len(items),
            )

        source_terms = [raw.english for raw in raws]
        return [
            _coerce_word_entry(
                raw=raw,
                item=items[i] if i < len(items) else {},
                source_terms=source_terms,
            )
            for i, raw in enumerate(raws)
        ]


class SentenceEnricher:
    """Generates distractors for all sentence entries in one model call."""

    def __init__(self, llm: BaseChatModel) -> None:
        self._chain: Runnable = _sentence_batch_prompt() | llm

    def enrich_many(self, raws: Sequence[RawSentence]) -> list[SentenceEntry]:
        if not raws:
            return []

        logger.info("enriching %d sentences with one LLM call", len(raws))
        payload = _invoke_json_batch(
            self._chain, _sentence_inputs_json(raws), "sentence"
        )
        items = _extract_items(payload, "sentence")
        if len(items) != len(raws):
            logger.warning(
                "sentence batch count mismatch: expected %d, got %d; filling missing locally",
                len(raws),
                len(items),
            )

        return [
            _coerce_sentence_entry(raw, items[i] if i < len(items) else {}, i)
            for i, raw in enumerate(raws)
        ]


def _invoke_json_batch(chain: Runnable, items_json: str, label: str) -> dict[str, Any]:
    try:
        response = chain.invoke({"items_json": items_json})
    except Exception as exc:
        raise EnrichmentError(f"failed to enrich {label} batch: {exc}") from exc

    if isinstance(response, dict):
        return response

    content = _message_content(response)
    try:
        return _parse_json_object(content)
    except Exception as exc:
        raise EnrichmentError(
            f"failed to parse {label} batch JSON: {exc}; output={content[:1000]}"
        ) from exc


def _message_content(response: object) -> str:
    content = getattr(response, "content", response)
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict):
                parts.append(str(block.get("text", "")))
        return "".join(parts)
    return str(content)


def _parse_json_object(text: str) -> dict[str, Any]:
    stripped = text.strip()
    if stripped.startswith("```"):
        stripped = re.sub(r"^```(?:json)?\s*", "", stripped)
        stripped = re.sub(r"\s*```$", "", stripped)
    start = stripped.find("{")
    if start < 0:
        raise ValueError("no JSON object found")
    fragment = stripped[start:]
    try:
        value, _ = json.JSONDecoder().raw_decode(fragment)
    except json.JSONDecodeError:
        value = repair_json(fragment, return_objects=True)
    if not isinstance(value, dict):
        raise ValueError("top-level JSON value is not an object")
    return value


def _extract_items(payload: dict[str, Any], label: str) -> list[dict[str, Any]]:
    raw_items = payload.get("items", [])
    if not isinstance(raw_items, list):
        raise EnrichmentError(f"{label} batch JSON did not contain an items array")
    return [item if isinstance(item, dict) else {} for item in raw_items]


def _word_inputs_json(raws: Sequence[RawWord]) -> str:
    return json.dumps(
        [
            {
                "index": i,
                "english": raw.english,
                "portuguese": raw.portuguese,
            }
            for i, raw in enumerate(raws, start=1)
        ],
        ensure_ascii=False,
        indent=2,
    )


def _sentence_inputs_json(raws: Sequence[RawSentence]) -> str:
    return json.dumps(
        [
            {
                "index": i,
                "english": raw.english,
                "portuguese": raw.portuguese,
                "theme": _SENTENCE_CATEGORIES[(i - 1) % len(_SENTENCE_CATEGORIES)],
            }
            for i, raw in enumerate(raws, start=1)
        ],
        ensure_ascii=False,
        indent=2,
    )


def _coerce_word_entry(
    *,
    raw: RawWord,
    item: dict[str, Any],
    source_terms: Sequence[str],
) -> WordEntry:
    distractors: list[RandomWord] = []
    seen: set[str] = set()
    target = _normalize_term(raw.english)

    def add_random_word(word: object, pronuncia: object = "") -> None:
        if len(distractors) >= 5:
            return
        if not isinstance(word, str) or not word.strip():
            return
        candidate = _normalize_term(word)
        if candidate == target or candidate in seen:
            return
        seen.add(candidate)
        distractors.append(
            RandomWord(
                word=word.strip(),
                pronuncia=coerce_pronuncia(word.strip(), pronuncia),
            )
        )

    for candidate in _iter_model_random_words(item.get("random_words")):
        add_random_word(candidate.get("word"), candidate.get("pronuncia"))
    for candidate in _fallback_word_candidates(raw.english, source_terms):
        add_random_word(candidate, _fallback_pronuncia(candidate))

    if len(distractors) != 5:
        raise EnrichmentError(
            f"failed to create five distractors for word {raw.english!r}"
        )

    return WordEntry(
        english=raw.english,
        portuguese=raw.portuguese,
        pronuncia=coerce_pronuncia(raw.english, item.get("pronuncia")),
        tipo=_coerce_non_empty_str(item.get("tipo"), _fallback_tipo(raw.english)),
        example=_coerce_non_empty_str(item.get("example"), _fallback_example(raw.english)),
        random_words=distractors,
    )


def _iter_model_random_words(value: object) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    result: list[dict[str, Any]] = []
    for entry in value:
        if isinstance(entry, dict):
            result.append(entry)
        elif isinstance(entry, str):
            result.append({"word": entry, "pronuncia": ""})
    return result


def _fallback_word_candidates(target: str, source_terms: Sequence[str]) -> list[str]:
    normalized_target = _normalize_term(target)
    candidates = [
        term
        for term in source_terms
        if _normalize_term(term) != normalized_target and term.strip()
    ]
    candidates.extend(_WORD_FALLBACK_BANK)
    unique_candidates = list(dict.fromkeys(candidates))

    def score(candidate: str) -> tuple[float, int]:
        ratio = SequenceMatcher(
            None, normalized_target, _normalize_term(candidate)
        ).ratio()
        return ratio, -abs(len(candidate) - len(target))

    return sorted(unique_candidates, key=score, reverse=True)


def _coerce_sentence_entry(
    raw: RawSentence,
    item: dict[str, Any],
    index: int,
) -> SentenceEntry:
    sentence_bag = _word_token_bag(raw.english)
    parts: list[str] = []
    seen: set[str] = set()

    def add_part(value: object) -> None:
        if len(parts) >= 2:
            return
        if not isinstance(value, str) or not value.strip():
            return
        candidate = value.strip().lower()
        if " " in candidate or candidate in seen or candidate in sentence_bag:
            return
        seen.add(candidate)
        parts.append(value.strip())

    random_words = item.get("random_words")
    if isinstance(random_words, str):
        for piece in random_words.split(","):
            add_part(piece)
    elif isinstance(random_words, list):
        for piece in random_words:
            add_part(piece)

    for candidate in _sentence_category_words(index):
        add_part(candidate)

    if len(parts) != 2:
        raise EnrichmentError(
            f"failed to create two sentence distractors for {raw.english!r}"
        )

    return SentenceEntry(
        english=raw.english,
        portuguese=raw.portuguese,
        random_words=f"{parts[0]}, {parts[1]}",
    )


def _sentence_category_words(index: int) -> list[str]:
    category = _SENTENCE_CATEGORIES[index % len(_SENTENCE_CATEGORIES)]
    _, _, examples = category.partition(":")
    words = [word.strip() for word in examples.split(",") if word.strip()]
    words.extend(["lamp", "forest", "river", "pencil", "orange", "silver"])
    return words


def _coerce_non_empty_str(value: object, fallback: str) -> str:
    if isinstance(value, str) and value.strip():
        return value.strip()
    return fallback


def _fallback_tipo(english: str) -> str:
    if " " in english.strip():
        return "expression"
    return "word"


def _fallback_example(english: str) -> str:
    return f"I learned {english} today."


def _fallback_pronuncia(english: str) -> str:
    return to_portuguese_phonetic(english)
