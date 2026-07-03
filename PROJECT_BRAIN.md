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

### In Progress / To Do
- [ ] Integration tests for CLI + github_client (currently uncovered I/O layers)
- [ ] Live end-to-end validation against a real PR with a real AI key

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
