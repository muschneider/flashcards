"""Pydantic schemas describing the vocab.json contract."""

from __future__ import annotations

from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints, field_validator

NonEmptyStr = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class RandomWord(BaseModel):
    """A distractor word with its Brazilian-Portuguese-friendly pronunciation."""

    word: NonEmptyStr = Field(description="Distractor word in English")
    pronuncia: NonEmptyStr = Field(
        description="Phonetic spelling friendly to Brazilian Portuguese readers"
    )


class WordGeneration(BaseModel):
    """LLM-generated metadata for a single word entry."""

    index: int = Field(
        description=(
            "The 1-based index copied verbatim from the matching input word. "
            "It identifies which input this object describes."
        )
    )
    english: NonEmptyStr = Field(
        description=(
            "The English word copied verbatim from the matching input word. "
            "Must equal the input term so the object can be matched back to it."
        )
    )
    pronuncia: NonEmptyStr = Field(
        description="Phonetic spelling of the English word for Brazilian Portuguese readers"
    )
    tipo: NonEmptyStr = Field(
        description="Grammatical role (noun, verb, adjective, expression, phrasal verb, idiom, ...)"
    )
    example: NonEmptyStr = Field(
        description="A short English example sentence that uses the target word"
    )
    random_words: list[RandomWord] = Field(
        description="Exactly five distractor words easily confused with the target word",
        min_length=5,
        max_length=5,
    )

    @field_validator("random_words")
    @classmethod
    def _ensure_distinct_distractors(cls, value: list[RandomWord]) -> list[RandomWord]:
        seen: set[str] = set()
        for entry in value:
            key = entry.word.strip().lower()
            if key in seen:
                raise ValueError(f"duplicate distractor word: {entry.word!r}")
            seen.add(key)
        return value


class WordBatchGeneration(BaseModel):
    """LLM-generated metadata for every parsed word, preserving input order."""

    items: list[WordGeneration] = Field(
        description="One generated metadata object per input word, in the same order",
        min_length=1,
    )


class SentenceGeneration(BaseModel):
    """LLM-generated distractors for a sentence entry."""

    index: int = Field(
        description=(
            "The 1-based index copied verbatim from the matching input sentence. "
            "It identifies which input this object describes."
        )
    )
    english: NonEmptyStr = Field(
        description=(
            "The English sentence copied verbatim from the matching input. "
            "Must equal the input sentence so the object can be matched back to it."
        )
    )
    random_words: NonEmptyStr = Field(
        description="Exactly two English words separated by a comma and space, e.g. 'apple, sky'"
    )

    @field_validator("random_words")
    @classmethod
    def _validate_two_words(cls, value: str) -> str:
        parts = [p.strip() for p in value.split(",")]
        if len(parts) != 2 or not all(parts):
            raise ValueError("random_words must contain exactly two non-empty words")
        return f"{parts[0]}, {parts[1]}"


class SentenceBatchGeneration(BaseModel):
    """LLM-generated distractors for every parsed sentence, preserving input order."""

    items: list[SentenceGeneration] = Field(
        description="One generated distractor object per input sentence, in the same order",
        min_length=1,
    )


class WordEntry(BaseModel):
    """Final shape of a word entry as written to vocab.json."""

    english: NonEmptyStr
    portuguese: NonEmptyStr
    pronuncia: NonEmptyStr
    tipo: NonEmptyStr
    example: NonEmptyStr
    random_words: list[RandomWord] = Field(min_length=5, max_length=5)


class SentenceEntry(BaseModel):
    """Final shape of a sentence entry as written to vocab.json."""

    english: NonEmptyStr
    portuguese: NonEmptyStr
    random_words: NonEmptyStr


class Vocab(BaseModel):
    """Top-level structure of vocab.json."""

    words: list[WordEntry]
    sentences: list[SentenceEntry]
