# 🛡️ DevGuard

**AI-assisted code review for GitHub pull requests.**

DevGuard combines a traditional static analyser (Semgrep) with an AI reasoning
layer that contextualises findings, filters false positives, flags risky
changes, and scores overall PR risk — so human reviewers focus on what matters.

```
PR opened → GitHub Action → Semgrep scans diff → AI filters + reasons
          → risk score (Low/Medium/High) → structured PR comment
```

> **License:** MIT · Public, solo-maintained, open to contributions.
> See [CONTRIBUTING.md](CONTRIBUTING.md) and [PROJECT_BRAIN.md](PROJECT_BRAIN.md).

---

## Quick start (local)

```bash
python -m venv .venv
.venv\Scripts\activate            # Windows  (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
pip install -r requirements-dev.txt

cp .env.example .env              # then edit .env with your provider + key
```

### Review a diff locally

```bash
# From a saved diff
python -m devguard.cli review-diff my.diff

# From git, piped in
git diff main...HEAD | python -m devguard.cli review-diff -

# Skip static analysis (AI only)
python -m devguard.cli review-diff my.diff --no-semgrep
```

### Review a GitHub PR

```bash
# Print the review
python -m devguard.cli review-pr MarutiDubey/DevGuard 42

# Post/update the review as a PR comment
python -m devguard.cli review-pr MarutiDubey/DevGuard 42 --post
```

### List AI providers

```bash
python -m devguard.cli providers
```

---

## AI providers

DevGuard is provider-agnostic. Set `AI_PROVIDER` in `.env`:

| `AI_PROVIDER` | Notes |
|---|---|
| `openrouter` | **Default.** One key, many models. Set `AI_API_KEY`. |
| `openai` | Direct OpenAI API. Set `AI_API_KEY`. |
| `ollama` | Local, free, offline. Run `ollama serve` first — no key needed. |

See [`devguard/ai_client/README.md`](devguard/ai_client/README.md) to add a provider.

> ⚠️ **Never commit your `.env` or API keys.** `.env` is git-ignored by default.

---

## GitHub Action

`.github/workflows/devguard-review.yml` runs DevGuard on every PR
(`opened` / `synchronize` / `reopened`) and posts a review comment.

Configure in your repo settings:
- **Secret** `AI_API_KEY` — your provider key.
- **Variables** (optional) `AI_PROVIDER`, `AI_MODEL`, `AI_BASE_URL` — default to OpenRouter + `gpt-4o-mini`.

`GITHUB_TOKEN` is provided automatically by Actions.

---

## Eval harness

Measure DevGuard's review quality against a corpus of diffs with **known** seeded
bugs — precision / recall / F1. Runs offline and deterministically by default.

```bash
python -m devguard.eval                  # mock provider (offline, no key)
python -m devguard.eval --live           # score the real provider from .env
python -m devguard.eval --json           # machine-readable output
python -m devguard.eval --fail-under 0.9 # exit non-zero if aggregate F1 < 0.9
```

The corpus ships **12 cases** (weak hash, `eval`, hardcoded secret, SQL injection
incl. f-string, unsafe `pickle`, a multi-bug diff, plus benign/clean cases and a
few categories the offline mock intentionally can't catch). The mock baseline is
**precision 1.00 / recall 0.73 / F1 0.84** — deliberately below 1.0 so the
scoring math is genuinely exercised (a real provider via `--live` should do
better). Cases live in [`devguard/eval/cases/`](devguard/eval/cases/) as
`<name>.diff` + `<name>.expected.json` pairs — add your own to grow the corpus.

## Development

```bash
pytest --cov=devguard          # tests
ruff check devguard tests      # lint
black . && isort .             # format
mypy devguard                  # types
pre-commit run --all-files     # all hooks
```

Roadmap and phases live in [CONTRIBUTING.md §1](CONTRIBUTING.md#1-development-roadmap).
