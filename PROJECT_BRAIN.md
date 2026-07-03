# PROJECT BRAIN — DevGuard
> Read this first. Single source of truth for any AI agent working on this project.
> Update this file when you make significant decisions, finish a phase, or discover a gotcha.

---

## What This Project Is

**DevGuard** — AI-assisted code review tool for GitHub pull requests.

**Flow:** PR opened → GitHub Action triggers → Semgrep scans diff for bug/security patterns → AI model reads diff + Semgrep findings, filters false positives, adds reasoning-based observations → assigns risk score (Low/Medium/High) → posts structured comment back to PR.

**Goal:** Let human reviewers focus on what actually matters instead of reading every line manually.

**License:** MIT. Public repo. Solo-maintained, open to contributions.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Language | Python 3.11+ |
| Static analysis | Semgrep |
| AI layer | Provider-agnostic (Ollama local by default, OpenAI/Cohere/Mistral optional) |
| CI/CD | GitHub Actions |
| Dashboard (Phase 3, not started) | React / Next.js |
| Package management | pip + requirements.txt |
| Linting | ruff / flake8 + black + isort |
| Type checking | mypy |
| Testing | pytest |
| Pre-commit | pre-commit hooks |

---

## Repository Structure

```
project root/
├── CONTRIBUTING.md        ← Full dev guide (branches, CI, PR process, caveman skills)
├── PROJECT_BRAIN.md       ← THIS FILE. Agent context. Keep updated.
├── AGENTS.md              ← Auto-read by Claude/Antigravity agents
├── GEMINI.md              ← Auto-read by Gemini CLI
├── .agents/
│   └── skills/            ← Caveman AI skills (auto-discovered by agent tools)
│       ├── caveman/
│       ├── caveman-commit/
│       ├── caveman-review/
│       ├── caveman-compress/
│       ├── caveman-help/
│       ├── caveman-stats/
│       └── cavecrew/
├── devguard/              ← Core Python application
│   ├── ai_client/         ← Provider-agnostic AI layer (registry.py = entry point)
│   ├── cli.py             ← CLI entry point: `python -m devguard.cli --help`
│   └── ...
├── tests/                 ← pytest test suite
├── .env.example           ← Environment template (copy to .env)
├── requirements.txt       ← Pinned runtime deps
└── requirements-dev.txt   ← Dev/test deps
```

---

## Active Phase

**Phase 1 — MVP (Core Review Engine)**

### Done (initial vertical slice, 2026-07-03)
- [x] GitHub Action trigger on PR open/sync (`.github/workflows/devguard-review.yml`)
- [x] Diff fetching + compression (`github_client.py`, `diff_utils.compress_diff`)
- [x] Semgrep integration for static analysis (`semgrep_runner.py`)
- [x] AI-powered review — contextualized findings + reasoning (`reviewer.py`, `ai_client/`)
- [x] Risk scoring (Low/Medium/High) with independent heuristic reconciliation (`risk.py`)
- [x] Structured PR comment output (`comment.py`)
- [x] Test suite (39 tests, mocked AI) + CI (`.github/workflows/ci.yml`)
- [x] Basic eval harness — seeded-bug corpus + precision/recall runner (`devguard/eval/`, `python -m devguard.eval`)
- [x] Integration tests for CLI + github_client (`tests/test_cli.py`, `tests/test_github_client.py`; I/O layers now cli 99% / github_client 100%, total coverage 89%)
- [x] CI eval F1 gate (`--fail-under 0.80` in `.github/workflows/ci.yml`)
- [x] Live end-to-end validation — `gpt-4o-mini` via OpenRouter scored P/R/F1 = 0.909 on the 12-case corpus

**Phase 1 (MVP) complete.** ✅

### Phase 2 — Enhanced Review Features (in progress, 2026-07-03)
- [x] `.devguard.toml` repo config — tunable `min_severity` + `ignore_paths` review policy, plus optional `[ai] model` (`devguard/config.py`, `devguard/policy.py`; filter wired into `reviewer.py` before risk scoring)
- [x] Cost/latency logging per review call — providers capture tokens + latency into `ReviewResult.usage`; `reviewer.py` prices the call via `devguard/pricing.py` (built-in table + optional `[pricing]` toml overrides) and logs it; `comment.py` renders a footer line
- [x] Fix suggestions (foundation) — optional `suggestion` field on `Finding`; the AI proposes drop-in replacement code, rendered as a ```suggestion block in the comment (`models.py`, `ai_client/prompt.py`, `comment.py`). Verbatim/flush-left so it's copy-pasteable now and commit-ready when posted inline later.
- [ ] Fix suggestions (inline) — post findings with a suggestion as inline review comments (Reviews API + diff line mapping) for GitHub's one-click "Commit suggestion" button
- [ ] `/describe` — auto-generated PR summary/description

> Update this list as tasks complete. Move done items to the Decisions/Completed log below.

---

## Key Entry Points

```bash
# Run app locally
python -m devguard.cli --help

# Run tests
pytest
pytest --cov=devguard

# Lint + format check
pre-commit run --all-files
black .
isort .
mypy devguard/

# Start local AI (default)
ollama serve
```

---

## Environment Setup (Quick)

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
pip install -r requirements-dev.txt
pre-commit install
cp .env.example .env
# Edit .env — defaults to Ollama (free, no API key)
pytest                          # verify setup
```

`.env` defaults:
```env
AI_PROVIDER=ollama
AI_BASE_URL=http://localhost:11434
AI_MODEL=llama3.1
GITHUB_TOKEN=your_github_pat_here
```

---

## Branching Rules (Short Version)

```
main       → production only, no direct push
develop    → integration branch, no direct push
feature/*  → branch from develop
fix/*      → branch from develop
hotfix/*   → branch from main, merge into main + develop
```

Merge strategy: feature → develop = squash merge. develop → main = merge commit.

---

## AI Provider Abstraction

All providers implement the same interface in `devguard/ai_client/`:
```python
review(diff, findings) -> ReviewResult
```

Registry: `ai_client/registry.py`. To add a new provider, implement the interface and register it there.

---

## Decisions Log
> Append decisions here so the next agent does not re-litigate them.

| Date | Decision | Reason |
|---|---|---|
| Project start | Default AI provider = Ollama | Zero cost for contributors during dev/iteration |
| Project start | Provider-agnostic AI layer | Allows switching to OpenAI/Cohere/Mistral for production |
| Project start | Python 3.11+ | Type hint improvements, better perf |
| Project start | Squash merge feature → develop | Keeps develop history clean |
| 2026-07-03 | Caveman skills installed in .agents/skills/ | Token efficiency for AI agent sessions |
| 2026-07-03 | PROJECT_BRAIN.md created | Universal context for multi-agent switching |
| 2026-07-03 | Default AI provider = **OpenRouter** (not Ollama) | Working key available; OpenAI-compatible, one key → many models. Ollama kept as free-local option. |
| 2026-07-03 | AI providers share an OpenAI-compatible base | openrouter/openai/ollama all speak `/chat/completions`; only base URL + headers differ. |
| 2026-07-03 | Risk = max(AI risk, heuristic risk) | Guards against a model under-reporting risk; heuristic keys off diff size + sensitive paths + finding severity. |
| 2026-07-03 | CLI forces UTF-8 stdout | Windows cp1252 consoles crash on emoji in the rendered comment. |
| 2026-07-03 | Eval harness: mock provider rediscovers bugs by regex, does NOT read the answer key | An answer-key mock would always score 100% and validate nothing; independent rediscovery keeps precision/recall < 1.0 so the scoring math is genuinely exercised. Mock deliberately has no `shell=True` detector → a guaranteed false negative that proves FN counting. |
| 2026-07-03 | Eval runs mock by default, `--live` for real provider; no CI F1 gate yet | Mock = deterministic/offline/CI-safe. F1 threshold deferred until the baseline is run on ~10–15 real diffs. `pytest` already covers the harness against rot. |
| 2026-07-03 | CI F1 gate enabled | `--fail-under 0.80` added to CI to guard against regression. |
| 2026-07-03 | Live Eval Baseline established | `gpt-4o-mini` via OpenRouter scored P=0.909, R=0.909, F1=0.909 on the 12-case corpus (10 TP, 1 FP, 1 FN on eval_input). |
| 2026-07-03 | Eval corpus expanded 6 → 12 cases; mock baseline precision 1.00 / recall 0.73 / F1 0.84 | Added a multi-bug diff, a `pickle` case (exercises a previously-uncovered detector), an f-string SQL case, benign/near-miss clean cases guarding precision, and os.system/yaml.load categories the mock deliberately can't catch (guaranteed FNs). `tests/test_eval.py` locks a per-case (tp,fp,fn) map so drift names the culprit. Corpus is now large enough to consider wiring a CI `--fail-under` gate. |
| 2026-07-03 | `.devguard.toml` config precedence = defaults < toml < env | Repo file sets team-wide policy; per-run env/CI secrets must be able to override it. API keys never read from the toml (env-only) to keep the committed file safe. Uses stdlib `tomllib` (py≥3.11) — no new dependency. |
| 2026-07-03 | Review policy filters findings *before* risk scoring | `apply_policy` runs in `reviewer.py` between the AI call and `heuristic_risk`, so `min_severity`/`ignore_paths` findings neither reach the PR comment nor inflate the risk level. `min_severity="info"` + no `ignore_paths` = default = zero behaviour change. |
| 2026-07-04 | Cost/latency: provider captures tokens+latency, reviewer prices it | The provider (`openai_compatible.py`) only records raw tokens + measured latency into `ReviewResult.usage`; the reviewer applies the pricing table because that's where the full `Config` (with `[pricing]` overrides) lives — keeps providers dependency-free. |
| 2026-07-04 | Pricing = hybrid hardcoded table + optional `[pricing]` toml override | `pricing.py` ships prices for common models (USD per 1M tokens, input/output billed separately); repo can override/extend via `[pricing]`. Unknown model → cost `None` → "cost unknown" rather than a wrong number. |
| 2026-07-04 | Fix suggestions shipped in two steps; step 1 = summary block | GitHub's one-click "Commit suggestion" only works in *inline review comments*, not the summary comment DevGuard posts. Step 1 (this): optional `suggestion` on `Finding`, rendered as a flush-left, verbatim ```suggestion block (copy-pasteable, commit-ready). Step 2 (later): post inline via the Reviews API for true one-click. `_clean_suggestion` strips stray code fences the model adds despite the "bare code" instruction. |

---

## Known Gotchas & Environment Notes

- **Windows:** Use `.venv\Scripts\activate` not `source .venv/bin/activate`
- **Ollama:** Must run `ollama serve` separately before starting the app
- **Large diffs:** DevGuard compresses diffs > MAX_DIFF_LINES (default 2000) — set in .env
- **Semgrep timeout:** Configurable via SEMGREP_TIMEOUT_SECONDS in .env (default 60s)
- **JSONC in settings:** Any JSON config reader must handle comments (JSONC format)

---

## AI Agent Workflow (Caveman Mode)

This project uses **caveman skills** for token-efficient AI sessions. Start any session with:

```
/caveman        ← full mode (default)
/caveman lite   ← terse but readable
/caveman ultra  ← maximum compression
```

**For commit messages:** `/caveman-commit`
**For PR reviews:** `/caveman-review`
**To stop:** `stop caveman`

Skills location: `.agents/skills/` — auto-discovered by any compatible agent.

See Section 14 of CONTRIBUTING.md for full command reference.

---

## How to Use This File

**When starting any AI agent session:**
```
Read PROJECT_BRAIN.md before anything else. That is the project context.
```

**When finishing significant work:** Update the Decisions Log and Active Phase task list.

**When you discover a gotcha:** Add it to Known Gotchas.

**When a phase completes:** Archive done tasks to Decisions Log, update Active Phase.
