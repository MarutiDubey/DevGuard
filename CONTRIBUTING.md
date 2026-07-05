# Contributing to DevGuard

## Project Overview

**DevGuard** is an AI-assisted code review tool that automatically analyzes GitHub pull requests and posts review feedback as PR comments. It combines a traditional static analysis scanner (Semgrep) with an AI reasoning layer that contextualizes findings, flags risky changes, and scores overall PR risk — so human reviewers can focus their attention on what actually matters instead of reading every line manually.

**How it works, in short:**
1. A GitHub Action triggers when a PR is opened or updated.
2. Semgrep scans the diff for known bug/security patterns.
3. An AI model (configurable — see [Section 9](#9-ai-service-configuration)) reads the diff + Semgrep findings, filters out false positives, adds reasoning-based observations, and assigns a risk score (Low/Medium/High).
4. The result is posted back to the PR as a structured comment.

This repository is currently maintained solo, but is public and open to outside contributions — this guide applies to any contributor, including future ones.

**License:** MIT — see [`LICENSE`](./LICENSE).

---

## Table of Contents

1. [Development Roadmap](#1-development-roadmap)
2. [Repository Setup & Branch Strategy](#2-repository-setup--branch-strategy)
3. [Environment Setup](#3-environment-setup)
4. [Issue Tracking & Labeling](#4-issue-tracking--labeling)
5. [Feature Development Workflow](#5-feature-development-workflow)
6. [Pull Request Process](#6-pull-request-process)
7. [CI/CD Pipeline](#7-cicd-pipeline)
8. [Git Hygiene](#8-git-hygiene)
9. [AI Service Configuration](#9-ai-service-configuration)
10. [Dependency Management & Security](#10-dependency-management--security)
11. [Documentation & Communication](#11-documentation--communication)
12. [Feature PR Checklist](#12-feature-pr-checklist)
13. [Templates](#13-templates)
14. [AI Agent Workflow (Caveman Skills)](#14-ai-agent-workflow-caveman-skills)
15. [Multi-Agent Context (PROJECT_BRAIN.md)](#15-multi-agent-context-project_brainmd)

---

## 1. Development Roadmap

Work is built in phases. Please check which phase an issue belongs to before starting — early contributions should stay within the current active phase unless otherwise agreed with the maintainer.

### Phase 1 — MVP (Weeks 1–4): Core Review Engine ✅ COMPLETE
- [x] GitHub Action trigger on PR open/sync
- [x] Diff fetching + compression (handle large PRs without blowing context limits)
- [x] Semgrep integration for static analysis
- [x] AI-powered `/review` — contextualized findings + reasoning-based observations
- [x] Risk scoring (Low / Medium / High) based on files touched and diff size
- [x] Structured PR comment output
- [x] Basic eval harness (seeded-bug sample repo to measure precision/recall)

### Phase 2 (Weeks 5–6): Enhanced Review Features ✅ COMPLETE
- [x] `/describe` — auto-generated PR summary/description
- [x] Fix suggestions (committable code suggestions, not auto-applied) — summary block + inline (`--suggest`)
- [x] Config file support (`.devguard.toml`) for tunable severity thresholds
- [x] Cost/latency logging per review call

### Phase 3 (Future): Dashboard & Analytics
- [ ] Web dashboard (React/Next.js) showing PR review history
- [ ] Risk trends and analytics over time across repos
- [ ] MCP server exposing test coverage / CI logs as live tools for the AI layer
- [ ] Multi-agent split (separate security / style / architecture review agents)

> **Note:** Phase 3 scope (especially dashboard UX) is not finalized yet — if you want to contribute here, open a Discussion first to align on design before writing code.

---

## 2. Repository Setup & Branch Strategy

### Branch Model

We use a simplified **GitFlow**-style strategy:

| Branch | Purpose | Protected? |
|---|---|---|
| `main` | Production-ready code only. Every commit here is deployable. | Yes — no direct pushes |
| `develop` | Integration branch. Features merge here first. | Yes — no direct pushes |
| `feature/<short-description>` | New features. Branched from `develop`. | No |
| `fix/<short-description>` | Bug fixes. Branched from `develop` (or `main` for hotfixes). | No |
| `hotfix/<short-description>` | Urgent production fixes. Branched from `main`, merged into both `main` and `develop`. | No |
| `chore/<short-description>` | Tooling, CI, docs, refactors with no behavior change. | No |

### Naming Convention

```
feature/pr-risk-scoring
fix/semgrep-timeout-on-large-diffs
hotfix/github-token-expiry-crash
chore/update-eval-harness-readme
```

Use lowercase, hyphen-separated, and keep it under ~50 characters.

### Initial Setup

```bash
# 1. Fork the repository on GitHub (if you're an external contributor)
# 2. Clone your fork
git clone https://github.com/<your-username>/devguard.git
cd devguard

# 3. Add the upstream remote
git remote add upstream https://github.com/<org>/devguard.git

# 4. Verify remotes
git remote -v

# 5. Create your feature branch from develop
git checkout develop
git pull upstream develop
git checkout -b feature/your-feature-name
```

---

## 3. Environment Setup

### Required Tools

| Tool | Version | Purpose |
|---|---|---|
| Python | 3.11+ | Core application language |
| Node.js | 20+ | Dashboard (Phase 3 — not required for Phase 1/2 work) |
| Git | 2.30+ | Version control |
| Docker | 24+ | Local containerized testing |
| Semgrep | latest | Static analysis engine |
| Ollama | latest | Local AI model runtime (default provider — see Section 9) |
| pre-commit | latest | Local lint/format hooks |

### Local Setup Steps

```bash
# 1. Create a virtual environment
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# 3. Install pre-commit hooks
pre-commit install

# 4. Install and start Ollama (default local AI provider)
# See https://ollama.com for install instructions
ollama pull llama3.1          # or your preferred model
ollama serve

# 5. Copy the environment template and fill in your config
cp .env.example .env
# Defaults to Ollama — see Section 9 for switching to a hosted provider

# 6. Run the test suite to confirm setup
pytest

# 7. (Optional) Run the app locally
python -m devguard.cli --help
```

### `.env.example` reference

```env
# Default: local free model via Ollama — no API key or cost required
AI_PROVIDER=ollama
AI_BASE_URL=http://localhost:11434
AI_MODEL=llama3.1

# To switch to a hosted provider instead, see Section 9 for all options
# AI_PROVIDER=openai
# AI_API_KEY=your_api_key_here
# AI_MODEL=gpt-4o-mini

GITHUB_TOKEN=your_github_pat_here
SEMGREP_TIMEOUT_SECONDS=60
MAX_DIFF_LINES=2000
LOG_LEVEL=INFO
```

---

## 4. Issue Tracking & Labeling

All work starts with a **GitHub Issue** — even small fixes. This keeps a traceable history and avoids duplicate effort.

### Before Opening an Issue

- Search existing issues (open **and** closed) to avoid duplicates.
- For bugs, confirm it's reproducible on the latest `develop` branch.

### Label Taxonomy

| Category | Labels |
|---|---|
| Type | `bug`, `feature`, `enhancement`, `docs`, `chore`, `security` |
| Priority | `priority: critical`, `priority: high`, `priority: medium`, `priority: low` |
| Status | `status: triage`, `status: in-progress`, `status: blocked`, `status: needs-review` |
| Difficulty | `good first issue`, `help wanted`, `advanced` |
| Area | `area: ci`, `area: review-engine`, `area: static-analysis`, `area: dashboard` |
| Phase | `phase: 1-mvp`, `phase: 2-enhancements`, `phase: 3-dashboard` |

### Issue Lifecycle

```
Opened → status: triage → maintainer assigns priority + area + phase labels
       → status: in-progress (once someone is assigned/claims it)
       → linked PR opened (PR references "Closes #123")
       → status: needs-review
       → Closed automatically when PR merges
```

**Claiming an issue:** Comment "I'd like to work on this" and wait for a maintainer to assign it to you before starting, to avoid duplicate work on popular issues.

---

## 5. Feature Development Workflow

This is the step-by-step process for shipping a feature, end to end:

1. **Find or create an issue** describing the feature. Get it labeled (type, priority, area, and phase) and assigned.
2. **Branch off `develop`**: `git checkout -b feature/your-feature-name`
3. **Write the code** in small, logical commits (see [Git Hygiene](#8-git-hygiene)).
4. **Write/update tests** — new logic requires new test coverage; bug fixes require a regression test.
5. **Run the full local check suite** before pushing:
   ```bash
   pre-commit run --all-files
   pytest --cov=devguard
   ```
6. **Update documentation** if you changed public behavior, config, or CLI flags.
7. **Push your branch** and open a **draft PR** early if the work is still in progress — this invites early feedback.
8. **Mark PR "Ready for review"** once complete, and fill out the PR template fully.
9. **Address review feedback** via new commits (don't force-push during active review — see Section 8).
10. **Squash and merge** once approved and CI is green.
11. **Delete the branch** after merge (GitHub can do this automatically).

---

## 6. Pull Request Process

### Before Opening a PR

- Rebase onto the latest `develop` to minimize conflicts.
- Ensure all CI checks pass locally first.
- Self-review your own diff on GitHub before requesting review — you'll often catch things you missed.

### PR Requirements

- **Title** follows [Conventional Commits](https://www.conventionalcommits.org/) style: `feat: add risk scoring to PR review output`
- **Description** filled out using the [PR template](#13-templates) — no empty templates accepted.
- **Linked issue**: include `Closes #<issue-number>` in the description.
- **Size**: aim for < 400 changed lines where possible. Large PRs should be split or clearly justified.
- **Tests**: new/changed logic must include tests. PRs that only add features without tests will be requested to add them.
- **Phase alignment**: PR should map to a roadmap phase (Section 1) — out-of-scope/future-phase work should be discussed first.

### Review & Merge Criteria

A PR can be merged when **all** of the following are true:

- [ ] At least **1 approving review** (from the maintainer, or a designated reviewer once the project has multiple maintainers).
- [ ] All CI checks green (build, tests, lint, security scan).
- [ ] No unresolved review comments/conversations.
- [ ] Branch is up to date with `develop` (no conflicts).
- [ ] Commit history is clean (squashed if messy — see Section 8).

### Merge Strategy

- **Feature branches → `develop`**: **Squash and merge** (keeps `develop` history clean, one commit per feature).
- **`develop` → `main`**: **Merge commit** (preserves the release history/batch of features going out).
- **`hotfix/*` → `main`**: **Squash and merge**, then cherry-pick or merge the same fix into `develop`.

---

## 7. CI/CD Pipeline

Every PR triggers the following pipeline (GitHub Actions):

```
1. Lint         → ruff / flake8 + black --check + isort --check
2. Type check    → mypy
3. Unit tests     → pytest with coverage report (fails if coverage drops below threshold)
4. Security scan  → semgrep + pip-audit / npm audit
5. Build          → package/build artifact, Docker image build (if applicable)
6. Integration test → runs DevGuard against a small sample repo with seeded bugs, checks recall %
```

### Common Failing Scenarios & Fixes

| Failure | Likely Cause | Fix |
|---|---|---|
| `lint` fails | Formatting not applied | Run `black .` and `isort .` locally, then commit |
| `type check` fails | Missing/incorrect type hints | Run `mypy devguard/` locally and resolve errors before pushing |
| `tests` fail | Broken logic or missing mocks (e.g., real API call in test) | Run `pytest -v` locally; ensure external calls are mocked |
| `coverage` drops below threshold | New code has no tests | Add tests covering new branches/functions |
| `security scan` fails | New dependency has a known CVE | Check `pip-audit` output, bump or replace the dependency |
| `build` fails | Missing dependency in `requirements.txt` / lockfile out of sync | Regenerate lockfile: `pip freeze > requirements.txt` (or `poetry lock`) |
| `integration test` fails | Regression in review-recall on seeded-bug sample repo | Investigate why previously-caught bugs are no longer flagged |
| Merge conflict blocks CI | Branch out of date with `develop` | `git fetch upstream && git rebase upstream/develop` |

CI must be fully green before requesting final review — don't ask for review on a red pipeline.

---

## 8. Git Hygiene

### Commit Messages

Follow **Conventional Commits**:

```
<type>(<scope>): <short summary>

<optional longer body explaining why, not just what>

<optional footer, e.g. "Closes #42">
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `security`

Examples:
```
feat(review-engine): add risk scoring based on touched file paths
fix(semgrep-runner): handle timeout on diffs over 2000 lines
docs(readme): clarify local setup steps for Windows
```

### Commit Practices

- Keep commits **small and logical** — one concern per commit (easier to review and revert).
- Write commit messages for future readers, not just yourself.
- Don't commit commented-out code, debug prints, or `.env` files.

### Rebase vs. Merge — When to Use Which

| Scenario | Use |
|---|---|
| Updating your feature branch with latest `develop` **before** review starts | `rebase` (`git rebase upstream/develop`) — keeps history linear |
| Updating your feature branch **during active review** (reviewer has already commented on specific commits) | `merge` — avoid rewriting history reviewers are looking at; or ask first |
| Combining messy WIP commits into clean ones before marking "ready for review" | `git rebase -i` (interactive rebase / squash) |
| Merging an approved feature branch into `develop` | Squash merge (via GitHub UI) |
| Merging `develop` into `main` for a release | Merge commit (via GitHub UI) |

**Rule of thumb:** Never force-push to a shared/protected branch. Force-pushing to your own feature branch is fine *before* review starts; avoid it after reviewers have left comments on specific commits (use `--force-with-lease` if you must, and warn reviewers).

### Squashing Before Review

```bash
# Interactive rebase to clean up last 5 commits before opening PR
git rebase -i HEAD~5
# mark commits as "squash" or "fixup" as appropriate, then:
git push --force-with-lease origin feature/your-feature-name
```

---

## 9. AI Service Configuration

DevGuard's review-reasoning layer is provider-agnostic by design — it works with any capable chat-completion API, including free local models. Configure your provider of choice in `.env` via `AI_PROVIDER`.

### Default: Ollama (Local, Free)

The project defaults to **Ollama** so contributors can develop and test with **zero API cost**:

```env
AI_PROVIDER=ollama
AI_BASE_URL=http://localhost:11434
AI_MODEL=llama3.1
```

Install Ollama from [ollama.com](https://ollama.com), pull a model (`ollama pull llama3.1` or a stronger/smaller variant depending on your machine), and run `ollama serve`. No API key, no cost, works offline.

### Hosted Provider Alternatives

| Provider | `AI_PROVIDER` value | Notes |
|---|---|---|
| OpenAI | `openai` | Use `gpt-4o-mini` for cost efficiency during development, `gpt-4o` for higher-quality review output. Requires `OPENAI_API_KEY`. |
| Cohere | `cohere` | Use `command-r-plus` for strong long-context reasoning over large diffs. Requires `COHERE_API_KEY`. |
| Mistral | `mistral` | `mistral-large-latest` is a solid, cheaper alternative for straightforward review tasks. Requires `MISTRAL_API_KEY`. |

**Switching providers:**

```env
AI_PROVIDER=openai
AI_API_KEY=your_openai_key
AI_MODEL=gpt-4o-mini
```

The provider abstraction lives in `devguard/ai_client/`. Each provider implements the same `review(diff, findings) -> ReviewResult` interface, so contributors can add a new provider by implementing that interface and registering it in `ai_client/registry.py`. See `ai_client/README.md` for the interface spec before submitting a new provider integration.

**Guidance:** Use Ollama for all local development and iteration (free, no rate limits to worry about). Switch to a hosted provider only for final quality validation or production deployment, where a stronger model may catch more nuanced issues.

---

## 10. Dependency Management & Security

- **Adding a dependency**: justify it in the PR description — what does it do, why is it needed, what's the alternative considered.
- **Pin versions** in `requirements.txt` / `package.json` — avoid unpinned `*` ranges for anything security-relevant.
- **Run security audits locally** before pushing:
  ```bash
  pip-audit                    # Python
  npm audit --production       # Node.js (Phase 3 dashboard only)
  semgrep --config=auto .      # Static analysis / secrets scan
  ```
- **Never commit secrets** — API keys, tokens, `.env` files. Use `git-secrets` or the pre-commit hook already configured in this repo to catch accidental commits.
- **Dependency updates** (Dependabot/Renovate PRs): reviewed like any other PR — check the changelog for breaking changes before approving, don't auto-merge major version bumps without testing.
- **License check**: new dependencies must use a permissive license (MIT, Apache-2.0, BSD) compatible with this project's MIT license — flag anything GPL/AGPL for maintainer review.

---

## 11. Documentation & Communication Expectations in PRs

- **PR description is not optional** — a one-line "fixed stuff" description will be sent back for revision.
- **Explain the "why," not just the "what"** — the diff shows *what* changed; the description should explain *why* this approach was chosen, especially for non-obvious decisions.
- **Screenshots/GIFs** required for any UI or CLI-output changes.
- **Breaking changes** must be called out explicitly in the PR description under a `## Breaking Changes` heading, and require a corresponding `CHANGELOG.md` entry.
- **Respond to review comments within a reasonable time** (aim for 2 business days); if you're stuck or need more time, say so in a comment rather than going silent.
- **Resolve conversations** only after the specific comment is actually addressed — don't mass-resolve.
- **Tag the right reviewers** — check `CODEOWNERS` for the affected area.

---

## 12. Feature PR Checklist

Copy this into your PR description and check off before requesting review:

```markdown
### Feature PR Checklist

- [ ] Linked to an issue (`Closes #___`)
- [ ] Maps to a roadmap phase (Section 1) — or discussed with maintainer if out-of-phase
- [ ] Branch is up to date with `develop` (rebased, no conflicts)
- [ ] Code follows existing style conventions (`pre-commit run --all-files` passes)
- [ ] New/changed logic has unit test coverage
- [ ] Integration test suite still passes (`pytest -m integration`)
- [ ] No secrets, API keys, or `.env` files committed
- [ ] Documentation updated (README, docstrings, or `/docs`) if public behavior changed
- [ ] CHANGELOG.md updated (if user-facing change)
- [ ] Screenshots/GIFs attached (if UI/CLI output changed)
- [ ] Self-reviewed the full diff on GitHub before requesting review
- [ ] CI pipeline is green
- [ ] Breaking changes (if any) called out explicitly in description
```

---

## 13. Templates

### `.github/PULL_REQUEST_TEMPLATE.md`

```markdown
## Summary

<!-- What does this PR do, in 1-3 sentences -->

## Related Issue

Closes #

## Roadmap Phase

<!-- Phase 1 (MVP) / Phase 2 (Enhancements) / Phase 3 (Dashboard) -->

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Chore / refactor (no behavior change)

## What Changed & Why

<!-- Explain the approach, not just the diff. Call out alternatives you considered, if relevant. -->

## How to Test

<!-- Steps for a reviewer to verify this works -->

1.
2.
3.

## Screenshots / Output (if applicable)

<!-- Before/after, CLI output, etc. -->

## Checklist

- [ ] Tests added/updated
- [ ] Docs updated
- [ ] `pre-commit run --all-files` passes locally
- [ ] No secrets committed
- [ ] CI is green

## Breaking Changes

<!-- List any, or write "None" -->
```

---

### `.github/ISSUE_TEMPLATE/bug_report.md`

```markdown
---
name: Bug Report
about: Report unexpected behavior
labels: bug, status: triage
---

## Description

<!-- Clear, concise description of the bug -->

## Steps to Reproduce

1.
2.
3.

## Expected Behavior

<!-- What you expected to happen -->

## Actual Behavior

<!-- What actually happened, include error messages/logs -->

## Environment

- DevGuard version:
- AI provider in use (ollama/openai/cohere/mistral):
- OS:
- Python version:

## Additional Context

<!-- Screenshots, related issues, etc. -->
```

---

### `.github/ISSUE_TEMPLATE/feature_request.md`

```markdown
---
name: Feature Request
about: Suggest a new feature or enhancement
labels: feature, status: triage
---

## Problem

<!-- What problem does this solve? Why is it needed? -->

## Proposed Solution

<!-- What you'd like to see happen -->

## Which Roadmap Phase Does This Fit?

<!-- Phase 1 / Phase 2 / Phase 3 / New idea not yet phased -->

## Alternatives Considered

<!-- Other approaches you thought about, if any -->

## Additional Context

<!-- Mockups, related issues, links -->
```

---

## 14. AI Agent Workflow (Caveman Skills)

This project uses **caveman skills** — a set of AI agent modes installed under `.agents/skills/` that cut token usage ~65–75% while keeping full technical accuracy. Works across Claude, Gemini, Cursor, Windsurf, Cline, Copilot, and any agent that reads AGENTS.md.

### Why Caveman?

Long sessions eat context fast. Caveman-compressed responses return the same information in ~1/3 the tokens — meaning the agent can work longer before hitting context limits, especially on large code reviews and multi-file edits.

### Available Skills & Slash Commands

| Command | When to Use | What It Does |
|---|---|---|
| `/caveman` | Start a session / save tokens | Full caveman mode: drop articles, fragments OK, no filler |
| `/caveman lite` | Want terse but readable prose | No filler/hedging, keeps full sentences |
| `/caveman ultra` | Maximum compression | Arrows for causality (X → Y), one word when sufficient |
| `/caveman-commit` | Staging a commit | Conventional Commits format, ≤50-char subject, why over what |
| `/caveman-review` | Reviewing a PR or diff | One-line findings: `L<line>: 🔴 bug: <problem>. <fix>.` |
| `/caveman-compress` | Compressing a docs/memory file | Compresses prose file to caveman style, saves `.original.md` backup |
| `/caveman-help` | Forget a command | Quick-reference card, one-shot |
| `/caveman-stats` | Check token savings | Shows lifetime tokens saved this session |
| `stop caveman` | Back to normal | Reverts to full prose |

### Intensity Levels

```
lite   → no filler/hedging, full sentences, professional but tight
full   → drop articles, fragments OK, short synonyms (default)
ultra  → abbreviate prose (DB/auth/config/req/res), arrows for causality
```

### Cavecrew — Compressed Subagents

For long sessions use the **cavecrew** delegation pattern to preserve main-context budget:

| Task | Subagent |
|---|---|
| "Where is X defined / what calls Y?" | `cavecrew-investigator` |
| Surgical edit ≤2 files, scope obvious | `cavecrew-builder` |
| Review diff/branch for bugs | `cavecrew-reviewer` |

**Locate → Fix → Verify pattern:**
1. `cavecrew-investigator` returns file:line list (~700 tokens vs 2k from vanilla Explore)
2. Main thread picks 1–2 sites → `cavecrew-builder`
3. `cavecrew-reviewer` audits the diff

### Usage Examples

```
# Start a dev session
/caveman

# Write a commit message
/caveman-commit

# Review a PR diff
/caveman-review

# Ultra-compress a long docs file
/caveman-compress ./docs/architecture.md

# Delegate a search to save context
Use cavecrew-investigator to find where `risk_score` is calculated
```

### Auto-Clarity (Safety Override)

Caveman **automatically drops to normal prose** for:
- Security warnings
- Irreversible action confirmations (DROP TABLE, mass deletes)
- Multi-step sequences where fragment ambiguity risks misread

It resumes compressed mode after the critical part. You cannot accidentally get a compressed "delete all your data" warning.

### Skill Files Location

Skills live in `.agents/skills/` at the project root and are auto-discovered by any agent that reads `AGENTS.md` or `GEMINI.md`:

```
.agents/
└── skills/
    ├── caveman/SKILL.md          ← core mode
    ├── caveman-commit/SKILL.md   ← commit messages
    ├── caveman-review/SKILL.md   ← PR reviews
    ├── caveman-compress/SKILL.md ← file compression
    ├── caveman-help/SKILL.md     ← quick reference
    ├── caveman-stats/SKILL.md    ← token savings
    └── cavecrew/SKILL.md         ← subagent delegation
```

---

## 15. Multi-Agent Context (PROJECT_BRAIN.md)

When switching between AI agents (Antigravity → Gemini CLI etc.), you lose session context. The **`PROJECT_BRAIN.md`** file at the project root solves this — a single source of truth any agent reads on startup.

### What's In It

- Project purpose and architecture in one paragraph
- Tech stack, key files, entry points
- Active phase and current tasks
- Decisions already made (so the agent doesn't re-litigate them)
- Known gotchas and environment quirks

### How to Use It

**When starting a new agent session**, paste this at the top of your first message:
```
Read PROJECT_BRAIN.md before anything else. That's the project context.
```

**When switching agents**, the file carries the context — no re-explaining needed.

**Keep it updated** — when you make a significant decision, add a one-liner to the "Decisions" section. Same for new gotchas, completed phases, and changed entry points.

### Agent Auto-Load (Already Configured)

| Agent | Config File | Status |
|---|---|---|
| Antigravity | `AGENTS.md` | ✅ Auto-loads PROJECT_BRAIN + all skills |
| Gemini CLI | `GEMINI.md` | ✅ Auto-loads PROJECT_BRAIN + all skills |

Both files reference `PROJECT_BRAIN.md` and all caveman skills — switching agents costs zero context re-explanation.

See `PROJECT_BRAIN.md` at the project root for the live context document.

---

## Questions?

Open a [Discussion](../../discussions) or ask in an existing related issue before starting significant work — it saves everyone time.
