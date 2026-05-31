"""Markdown parsing for the flashcard source file.

The expected input file follows this convention:

    # Words

    - english phrase - portuguese meaning
    - other english - other portuguese

    # Sentences

    - English sentence here
    - Portuguese translation here

    - Another English sentence
    - Another Portuguese translation
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

_BULLET_RE = re.compile(r"^[-*+]\s+(.*)$")
_HEADING_RE = re.compile(r"^#{1,6}\s+(.*)$")
_WORD_SPLIT_RE = re.compile(r"\s+[-–—]\s+")


@dataclass(slots=True, frozen=True)
class RawWord:
    english: str
    portuguese: str


@dataclass(slots=True, frozen=True)
class RawSentence:
    english: str
    portuguese: str


@dataclass(slots=True, frozen=True)
class ParsedMarkdown:
    words: list[RawWord]
    sentences: list[RawSentence]


def _normalize_line(value: str) -> str:
    return value.strip().rstrip(".").strip()


def _classify_heading(text: str) -> str | None:
    lowered = text.strip().lower()
    if "word" in lowered:
        return "words"
    if "sentence" in lowered or "phrase" in lowered:
        return "sentences"
    return None


def _split_word_line(raw: str) -> tuple[str, str] | None:
    """Split a `english - portuguese` bullet, tolerating multiple hyphens.

    The first ` - ` (or em-dash variants) separates the English term from the meaning.
    """
    match = _WORD_SPLIT_RE.search(raw)
    if not match:
        return None
    english = raw[: match.start()].strip()
    portuguese = raw[match.end() :].strip()
    if not english or not portuguese:
        return None
    return english, portuguese


def parse_markdown_text(text: str) -> ParsedMarkdown:
    """Parse the markdown source and return raw words and sentence pairs."""
    section: str | None = None
    words: list[RawWord] = []
    sentence_buffer: list[str] = []
    sentences: list[RawSentence] = []
    seen_english: set[str] = set()

    def _flush_sentence_buffer() -> None:
        nonlocal sentence_buffer
        if len(sentence_buffer) >= 2:
            sentences.append(
                RawSentence(
                    english=sentence_buffer[0],
                    portuguese=sentence_buffer[1],
                )
            )
        sentence_buffer = []

    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        heading = _HEADING_RE.match(line.strip())
        if heading:
            _flush_sentence_buffer()
            section = _classify_heading(heading.group(1))
            continue

        bullet = _BULLET_RE.match(line.strip())
        if not bullet:
            # blank or paragraph line resets the sentence buffer to avoid mis-pairings
            if not line.strip():
                if section == "sentences" and len(sentence_buffer) == 1:
                    sentence_buffer = []
            continue

        content = bullet.group(1).strip()
        if not content:
            continue

        if section == "words":
            split = _split_word_line(content)
            if split is None:
                continue
            english_raw, portuguese_raw = split
            english = _normalize_line(english_raw)
            portuguese = _normalize_line(portuguese_raw)
            if not english or not portuguese:
                continue
            key = english.lower()
            if key in seen_english:
                continue
            seen_english.add(key)
            words.append(RawWord(english=english, portuguese=portuguese))
        elif section == "sentences":
            sentence_buffer.append(content)
            if len(sentence_buffer) == 2:
                _flush_sentence_buffer()

    _flush_sentence_buffer()
    return ParsedMarkdown(words=words, sentences=sentences)


def parse_markdown_file(path: Path) -> ParsedMarkdown:
    """Read a markdown file from disk and parse it."""
    if not path.is_file():
        raise FileNotFoundError(f"Markdown file not found: {path}")
    return parse_markdown_text(path.read_text(encoding="utf-8"))
