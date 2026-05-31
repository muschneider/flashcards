"""Deterministic LangChain Tool pipeline that builds vocab.json.

OpenRouter is used only by the enrichment chains: one LLM call for all parsed
words and one LLM call for all parsed sentences. Tool orchestration is local and
deterministic so the CLI does not spend extra model calls deciding which tool to
run next.
"""

from __future__ import annotations

import logging

from langchain_core.tools import BaseTool

from agent.config import AgentConfig
from agent.enrichers import SentenceEnricher, WordEnricher
from agent.llm import build_chat_model
from agent.tools import build_tools
from agent.workspace import Workspace

logger = logging.getLogger(__name__)


def build_pipeline(config: AgentConfig) -> tuple[list[BaseTool], Workspace]:
    """Wire workspace, deterministic tools and LLM enrichers together."""
    config.require_api_key()

    workspace = Workspace(
        markdown_path=config.markdown_path,
        output_path=config.output_path,
    )

    enrichment_llm = build_chat_model(config, max_tokens=12000)
    word_enricher = WordEnricher(enrichment_llm)
    sentence_enricher = SentenceEnricher(enrichment_llm)
    tools = build_tools(
        workspace,
        word_enricher=word_enricher,
        sentence_enricher=sentence_enricher,
    )
    return tools, workspace


def run_agent(config: AgentConfig) -> Workspace:
    """Execute the pipeline end-to-end and return the produced workspace."""
    tools, workspace = build_pipeline(config)

    logger.info(
        "starting pipeline run; markdown=%s, output=%s, model=%s",
        config.markdown_path,
        config.output_path,
        config.model,
    )

    for tool in tools:
        logger.info("running tool :: %s", tool.name)
        status = tool.invoke({})
        logger.info("tool %s :: %s", tool.name, _trim(status))
        if not isinstance(status, str) or not status.startswith("OK"):
            raise RuntimeError(f"tool {tool.name} failed: {status}")

    logger.info(
        "pipeline finished: wrote %d words and %d sentences to %s",
        len(workspace.enriched_words),
        len(workspace.enriched_sentences),
        workspace.saved_path,
    )
    return workspace


def _trim(text: object, limit: int = 320) -> str:
    if not isinstance(text, str):
        text = str(text)
    text = text.replace("\n", " ").strip()
    if len(text) > limit:
        return text[: limit - 3] + "..."
    return text
