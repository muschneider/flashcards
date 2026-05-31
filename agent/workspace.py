"""Shared mutable state that the LangChain tools read from and write to."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from agent.parser import RawSentence, RawWord
from agent.schemas import SentenceEntry, WordEntry


@dataclass(slots=True)
class Workspace:
    """Holds intermediate results between tool calls during one agent run."""

    markdown_path: Path
    output_path: Path
    raw_words: list[RawWord] = field(default_factory=list)
    raw_sentences: list[RawSentence] = field(default_factory=list)
    enriched_words: list[WordEntry] = field(default_factory=list)
    enriched_sentences: list[SentenceEntry] = field(default_factory=list)
    validation_errors: list[str] = field(default_factory=list)
    validated: bool = False
    saved_path: Path | None = None

    def reset_outputs(self) -> None:
        self.enriched_words = []
        self.enriched_sentences = []
        self.validation_errors = []
        self.validated = False
        self.saved_path = None

    @property
    def has_parsed_input(self) -> bool:
        return bool(self.raw_words) or bool(self.raw_sentences)
