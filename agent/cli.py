"""Command line entry point for the flashcards agent."""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

from agent.config import AgentConfig
from agent.orchestrator import run_agent

logger = logging.getLogger(__name__)


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="flashcards-agent",
        description=(
            "Run the LangChain tool pipeline that converts a Markdown source file "
            "into the vocab.json used by the Next.js flashcards app."
        ),
    )
    parser.add_argument(
        "--markdown",
        type=Path,
        default=None,
        help="Path to the Markdown source file. Defaults to the obsidian flashcard.md.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Path to write vocab.json. Defaults to src/data/vocab.json next to pyproject.toml.",
    )
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        help="OpenRouter model id (default: openai/gpt-oss-120b:free).",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Reduce log output.",
    )
    return parser.parse_args(argv)


def _configure_logging(quiet: bool) -> None:
    level = logging.WARNING if quiet else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s :: %(message)s",
        datefmt="%H:%M:%S",
    )


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)
    _configure_logging(args.quiet)

    config = AgentConfig.from_env()
    if args.markdown is not None:
        config.markdown_path = args.markdown
    if args.output is not None:
        config.output_path = args.output
    if args.model is not None:
        config.model = args.model
    if not config.api_key:
        logger.error(
            "OPENROUTER_API_KEY is missing. Source mise.toml or export it manually."
        )
        return 2

    if not config.markdown_path.is_file():
        logger.error("Markdown source not found: %s", config.markdown_path)
        return 3

    try:
        workspace = run_agent(config)
    except KeyboardInterrupt:
        logger.warning("interrupted by user")
        return 130
    except Exception as exc:  # pragma: no cover - top-level catch-all
        logger.exception("agent run failed: %s", exc)
        return 1

    if workspace.saved_path is None:
        logger.error("agent finished but vocab.json was not written")
        if workspace.validation_errors:
            for err in workspace.validation_errors:
                logger.error("validation: %s", err)
        return 4

    logger.info(
        "wrote vocab.json with %d words and %d sentences to %s",
        len(workspace.enriched_words),
        len(workspace.enriched_sentences),
        workspace.saved_path,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
