"""Runtime configuration for the flashcards agent."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

DEFAULT_MARKDOWN_PATH = Path(
    "/home/mauro/ws/obsidian/mauro/english/words_and_sentences/flashcard.md"
)
DEFAULT_OUTPUT_PATH = Path(__file__).resolve().parent.parent / "src" / "data" / "vocab.json"
DEFAULT_MODEL = "openai/gpt-oss-120b:free"
DEFAULT_BASE_URL = "https://openrouter.ai/api/v1"


@dataclass(slots=True)
class AgentConfig:
    """User-tunable configuration for one agent run."""

    markdown_path: Path = DEFAULT_MARKDOWN_PATH
    output_path: Path = DEFAULT_OUTPUT_PATH
    model: str = DEFAULT_MODEL
    base_url: str = DEFAULT_BASE_URL
    api_key: str = ""
    #temperature: float = 0.5
    temperature: float = 0.2
    word_chunk_size: int = 24
    extra_headers: dict[str, str] = field(default_factory=dict)

    @classmethod
    def from_env(cls) -> "AgentConfig":
        """Build a config from environment variables, applying defaults where missing."""
        return cls(
            markdown_path=Path(os.getenv("FLASHCARDS_MARKDOWN", str(DEFAULT_MARKDOWN_PATH))),
            output_path=Path(os.getenv("FLASHCARDS_OUTPUT", str(DEFAULT_OUTPUT_PATH))),
            model=os.getenv("OPENROUTER_MODEL", DEFAULT_MODEL),
            base_url=os.getenv("OPENROUTER_BASE_URL", DEFAULT_BASE_URL),
            api_key=os.getenv("OPENROUTER_API_KEY", ""),
            temperature=float(os.getenv("FLASHCARDS_TEMPERATURE", "0.5")),
            word_chunk_size=int(os.getenv("FLASHCARDS_WORD_CHUNK_SIZE", "24")),
            extra_headers={
                "HTTP-Referer": os.getenv(
                    "OPENROUTER_REFERER",
                    "https://github.com/local/flashcards-agent",
                ),
                "X-Title": os.getenv("OPENROUTER_APP_TITLE", "Flashcards Vocab Generator"),
            },
        )

    def require_api_key(self) -> None:
        if not self.api_key:
            raise RuntimeError(
                "OPENROUTER_API_KEY is not set. Configure it via mise.toml or your shell env."
            )
