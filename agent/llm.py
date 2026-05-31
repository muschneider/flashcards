"""LLM client setup for OpenRouter via the OpenAI-compatible endpoint."""

from __future__ import annotations

from langchain_openai import ChatOpenAI

from agent.config import AgentConfig


def build_chat_model(
    config: AgentConfig,
    *,
    temperature: float | None = None,
    max_tokens: int | None = None,
) -> ChatOpenAI:
    """Create a ChatOpenAI configured to talk to OpenRouter."""
    config.require_api_key()
    kwargs = {
        "model": config.model,
        "base_url": config.base_url,
        "api_key": config.api_key,
        "temperature": config.temperature if temperature is None else temperature,
        "timeout": 120,
        "max_retries": 2,
        "default_headers": config.extra_headers or None,
    }
    if max_tokens is not None:
        kwargs["max_tokens"] = max_tokens
    return ChatOpenAI(**kwargs)
