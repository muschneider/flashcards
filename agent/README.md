# flashcards-agent

A small Python LangChain agent that builds `src/data/vocab.json` (consumed by the
Next.js flashcards app) from a Markdown source file kept in Obsidian.

It is a separate Python project that lives at the repo root next to the Next.js
app. Nothing in `src/` is modified by the agent except for `src/data/vocab.json`,
which is overwritten on every successful run.

## How it works

The pipeline is implemented as five deterministic LangChain Tools, exposed in
`agent/tools.py` and run locally in order by `agent/orchestrator.py`:

1. `parse_markdown_file` - reads the Markdown source and extracts the "Words"
   and "Sentences" sections into a shared workspace (`agent/parser.py`,
   `agent/workspace.py`).
2. `enrich_words` - makes one LLM call for all parsed words to produce a
    `pronuncia`, `tipo`, `example`, and exactly five `random_words` distractors
    (`agent/enrichers.py`).
3. `enrich_sentences` - makes one LLM call for all parsed sentences to produce
   two distractor `random_words` that do NOT appear in the English sentence.
4. `validate_vocab` - enforces the contract defined by the Pydantic schemas
   in `agent/schemas.py`: counts match, no duplicate distractors, sentence
   distractors are absent from the sentence, etc.
5. `save_vocab_json` - writes the final `vocab.json` to disk (only if the
   workspace has been validated successfully).

The CLI does not use the LLM to choose tools. This keeps OpenRouter usage to two
model calls per successful run: one for words and one for sentences.

The LLM is reached through OpenRouter using the OpenAI-compatible endpoint.
The default model is `openai/gpt-oss-120b:free` and can be overridden via
`--model` or the `OPENROUTER_MODEL` env var. Use the `/api/v1/models`
endpoint to discover other free models. Other free models
verified to work include `openai/gpt-oss-20b:free` (faster, slightly lower
quality) and `z-ai/glm-4.5-air:free`.

## Requirements

- Python 3.12 (provided by `mise.toml`).
- `uv` for dependency management (provided by `mise.toml`).
- `OPENROUTER_API_KEY` exported in the environment (set in `mise.toml`).

## Install and run

From the repo root:

```bash
# install dependencies into .venv
uv sync

# run the agent with defaults
uv run flashcards-agent

# or with overrides
uv run flashcards-agent \
  --markdown /home/mauro/ws/obsidian/mauro/english/words_and_sentences/flashcard.md \
  --output ./src/data/vocab.json \
  --model openai/gpt-oss-120b:free
```

CLI flags:

| Flag | Default | Description |
| ---- | ------- | ----------- |
| `--markdown` | `/home/mauro/ws/obsidian/mauro/english/words_and_sentences/flashcard.md` | Markdown source file |
| `--output` | `./src/data/vocab.json` | Where to write the JSON |
| `--model` | `openai/gpt-oss-120b:free` | OpenRouter model id |
| `--quiet` | off | Lower the log level |

Environment overrides: `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`,
`OPENROUTER_MODEL`, `FLASHCARDS_MARKDOWN`, `FLASHCARDS_OUTPUT`,
`FLASHCARDS_TEMPERATURE`.

## Output contract

`src/data/vocab.json` matches the shape consumed by
`src/lib/defaultCards.ts`:

```json
{
  "words": [
    {
      "english": "rule",
      "portuguese": "regra, norma",
      "pronuncia": "rúl",
      "tipo": "noun",
      "example": "Follow the golden rule",
      "random_words": [
        { "word": "role", "pronuncia": "rôul" },
        { "word": "roll", "pronuncia": "rôul" },
        { "word": "ruler", "pronuncia": "rú-lâr" },
        { "word": "real", "pronuncia": "rí-al" },
        { "word": "rail", "pronuncia": "rêil" }
      ]
    }
  ],
  "sentences": [
    {
      "english": "It's nice to meet you",
      "portuguese": "Prazer em conhecê-lo",
      "random_words": "coffee, tea"
    }
  ]
}
```
