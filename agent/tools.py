"""LangChain Tools the agent uses to build vocab.json end to end.

Every tool mutates the shared :class:`Workspace` and returns a short status string
so the deterministic orchestrator can chain them in the right order. Heavy
lifting (LLM calls, JSON serialization, file IO) lives inside the tools.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

from langchain_core.tools import BaseTool, StructuredTool

from agent.enrichers import SentenceEnricher, WordEnricher
from agent.parser import parse_markdown_file
from agent.pronunciation import is_english_spelling_echo
from agent.schemas import Vocab
from agent.workspace import Workspace

logger = logging.getLogger(__name__)


def build_tools(
    workspace: Workspace,
    *,
    word_enricher: WordEnricher,
    sentence_enricher: SentenceEnricher,
) -> list[BaseTool]:
    """Return the ordered list of tools the agent can invoke."""

    def parse_markdown_file_tool() -> str:
        """Read the Markdown source file, extract the Words and Sentences sections.

        Always call this tool first. It populates the shared workspace with the
        raw (english, portuguese) pairs found in the file. Returns a summary
        with the counts and the first item of each section so the agent can
        sanity-check the parsing.
        """
        workspace.reset_outputs()
        parsed = parse_markdown_file(workspace.markdown_path)
        workspace.raw_words = list(parsed.words)
        workspace.raw_sentences = list(parsed.sentences)
        if not workspace.has_parsed_input:
            return (
                "ERROR: parsed 0 words and 0 sentences. "
                f"Check the markdown formatting at {workspace.markdown_path}."
            )
        first_word = parsed.words[0] if parsed.words else None
        first_sentence = parsed.sentences[0] if parsed.sentences else None
        return (
            f"OK: parsed {len(parsed.words)} words and {len(parsed.sentences)} sentences "
            f"from {workspace.markdown_path}. "
            f"First word: {first_word!r}. First sentence: {first_sentence!r}."
        )

    def enrich_words_tool() -> str:
        """Call the LLM once for all parsed words to generate `pronuncia`,
        `tipo`, `example`, and 5 `random_words` distractors per word.

        Requires `parse_markdown_file_tool` to have been run first. The full
        enriched list is stored in the workspace. Returns the count of
        enriched entries and the first one as a sanity-check sample.
        """
        if not workspace.raw_words:
            return (
                "ERROR: no raw words in workspace. "
                "Run parse_markdown_file_tool before calling this tool."
            )
        logger.info("enriching %d words in one LLM call", len(workspace.raw_words))
        enriched = word_enricher.enrich_many(workspace.raw_words)
        workspace.enriched_words = enriched
        first = enriched[0].model_dump() if enriched else None
        return (
            f"OK: enriched {len(enriched)} of {len(workspace.raw_words)} words. "
            f"Sample entry: {json.dumps(first, ensure_ascii=False)}"
        )

    def enrich_sentences_tool() -> str:
        """Call the LLM once for all parsed sentences to generate two
        distractor words per sentence that do NOT appear inside the sentence.

        Requires `parse_markdown_file_tool` to have been run first. The full
        enriched list is stored in the workspace. Returns the count of enriched
        entries and the first one as a sanity-check sample.
        """
        if not workspace.raw_sentences:
            return (
                "ERROR: no raw sentences in workspace. "
                "Run parse_markdown_file_tool before calling this tool."
            )
        logger.info(
            "enriching %d sentences in one LLM call", len(workspace.raw_sentences)
        )
        enriched = sentence_enricher.enrich_many(workspace.raw_sentences)
        workspace.enriched_sentences = enriched
        first = enriched[0].model_dump() if enriched else None
        return (
            f"OK: enriched {len(enriched)} of {len(workspace.raw_sentences)} sentences. "
            f"Sample entry: {json.dumps(first, ensure_ascii=False)}"
        )

    def validate_vocab_tool() -> str:
        """Validate the enriched workspace data against the vocab.json schema.

        Checks: counts match the parsed input, every word has exactly 5 distinct
        distractor words, every sentence has two distinct distractor words that
        do not appear inside the English sentence, and no required field is
        missing. Returns OK or a list of validation errors.
        """
        errors: list[str] = []
        if not workspace.enriched_words:
            errors.append("no enriched words in workspace")
        if not workspace.enriched_sentences:
            errors.append("no enriched sentences in workspace")
        if len(workspace.enriched_words) != len(workspace.raw_words):
            errors.append(
                "word count mismatch: parsed "
                f"{len(workspace.raw_words)} but enriched "
                f"{len(workspace.enriched_words)}"
            )
        if len(workspace.enriched_sentences) != len(workspace.raw_sentences):
            errors.append(
                "sentence count mismatch: parsed "
                f"{len(workspace.raw_sentences)} but enriched "
                f"{len(workspace.enriched_sentences)}"
            )

        for entry in workspace.enriched_sentences:
            sentence_bag = _sentence_token_bag(entry.english)
            for piece in entry.random_words.split(","):
                candidate = piece.strip().lower()
                if candidate and candidate in sentence_bag:
                    errors.append(
                        f"sentence distractor {candidate!r} appears inside "
                        f"english sentence {entry.english!r}"
                    )

        for entry in workspace.enriched_words:
            if is_english_spelling_echo(entry.english, entry.pronuncia):
                errors.append(
                    f"word {entry.english!r} has pronunciation echo {entry.pronuncia!r}"
                )
            distractor_keys = {rw.word.strip().lower() for rw in entry.random_words}
            if len(distractor_keys) != 5:
                errors.append(
                    f"word {entry.english!r} has duplicate or missing distractors"
                )
            for random_word in entry.random_words:
                if is_english_spelling_echo(random_word.word, random_word.pronuncia):
                    errors.append(
                        f"word {entry.english!r} has distractor "
                        f"{random_word.word!r} with pronunciation echo "
                        f"{random_word.pronuncia!r}"
                    )

        try:
            Vocab(words=workspace.enriched_words, sentences=workspace.enriched_sentences)
        except Exception as exc:  # pragma: no cover - defensive
            errors.append(f"schema validation failed: {exc}")

        workspace.validation_errors = errors
        workspace.validated = not errors
        if errors:
            return "ERROR: validation found " + str(len(errors)) + " issue(s): " + "; ".join(
                errors[:10]
            )
        return (
            f"OK: validated {len(workspace.enriched_words)} words and "
            f"{len(workspace.enriched_sentences)} sentences against the schema."
        )

    def save_vocab_json_tool() -> str:
        """Serialize the validated workspace to disk at `src/data/vocab.json`.

        Only call this AFTER `validate_vocab_tool` returns OK. Overwrites any
        existing file. Returns the absolute output path on success.
        """
        if not workspace.validated:
            return (
                "ERROR: workspace has not been validated. "
                "Run validate_vocab_tool successfully before saving."
            )
        if not workspace.enriched_words or not workspace.enriched_sentences:
            return "ERROR: workspace is empty. Nothing to save."

        payload = Vocab(
            words=workspace.enriched_words, sentences=workspace.enriched_sentences
        ).model_dump(mode="json")

        output_path = workspace.output_path
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open("w", encoding="utf-8") as fp:
            json.dump(payload, fp, ensure_ascii=False, indent=2)
            fp.write("\n")
        workspace.saved_path = output_path
        return (
            f"OK: wrote {len(workspace.enriched_words)} words and "
            f"{len(workspace.enriched_sentences)} sentences to {output_path}."
        )

    return [
        StructuredTool.from_function(
            func=parse_markdown_file_tool,
            name="parse_markdown_file",
        ),
        StructuredTool.from_function(
            func=enrich_words_tool,
            name="enrich_words",
        ),
        StructuredTool.from_function(
            func=enrich_sentences_tool,
            name="enrich_sentences",
        ),
        StructuredTool.from_function(
            func=validate_vocab_tool,
            name="validate_vocab",
        ),
        StructuredTool.from_function(
            func=save_vocab_json_tool,
            name="save_vocab_json",
        ),
    ]


def _sentence_token_bag(sentence: str) -> set[str]:
    import re

    bag: set[str] = set()
    for token in re.findall(r"[A-Za-z']+", sentence.lower()):
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


# Make Path importable for typing in tests
__all__ = ["build_tools", "Path"]
