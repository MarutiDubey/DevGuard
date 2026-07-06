<div align="center">
  <img src="docs/owl_round.png" alt="GitOwl logo" width="120" height="120" />

  # GitOwl
  **AI-powered code review that lives inside your pull requests.**

  *A robust, provider-agnostic engine that flags bugs, scores risk, and posts structured reviews before a human ever opens the diff.*
  <br/>
  **Original Concept and Development by Manthan Dubey**

  [![Live Demo](https://img.shields.io/badge/Live_Demo-gitowl.vercel.app-1e3a8a?style=for-the-badge)](https://gitowl.vercel.app)
  [![PyPI](https://img.shields.io/pypi/v/gitowl?style=for-the-badge&color=1e3a8a&label=PyPI)](https://pypi.org/project/gitowl/)
  [![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

  <br/>

  > Instead of a human reviewer starting from a cold diff, the team gets an AI summary of what changed, a prioritized list of issues with reasoning, one-click fix suggestions, and an overall risk score — so review time goes to the changes that actually matter.

  <br/>

  [**Live Playground**](https://gitowl.vercel.app) | [**Install**](#-install--use-locally) | [**GitHub Action**](#-add-gitowl-to-your-repo-in-3-steps) | [**Report Bug**](https://github.com/MarutiDubey/GitOwl/issues)

</div>

---

## 📑 Table of Contents
- [✨ Overview](#-overview)
- [🚀 Key Features](#-key-features)
- [⚡ Add GitOwl to your repo](#-add-gitowl-to-your-repo-in-3-steps)
- [🛠️ Tech Stack](#️-tech-stack)
- [📦 Install & use locally](#-install--use-locally)
- [⚙️ Configuration](#️-configuration-gitowltoml)
- [🏗️ How it's built](#️-how-its-built)
- [📄 License](#-license)

---

## ✨ Overview

Open a pull request and GitOwl does the first review pass for you:

```
 PR opened  →  GitHub Action  →  static analysis + AI reasoning
            →  risk score (Low / Medium / High)  →  structured review comment
```

> **Try it in your browser first:** paste any diff into the
> **[live playground](https://gitowl.vercel.app)** and watch GitOwl review it in
> real time — no install, no signup.

---

## 🚀 Key Features

| | Feature |
|---|---|
| 🔎 | **AI Code Review** — Contextual findings with reasoning, not just pattern matches. Filters false positives so the noise stays low. |
| 🚦 | **Risk Scoring** — Every PR is scored Low / Medium / High from the files touched and the nature of the change. |
| ✍️ | **One-Click Fix Suggestions** — Confident fixes are posted as GitHub inline suggestions you can commit in a single click. |
| 📝 | **Auto PR Descriptions** — Generate a title, summary, and change list straight from the diff. |
| 🛡️ | **Optional Static Analysis** — Pairs an AI layer with Semgrep when you want both; auto-detected, never required. |
| ⚙️ | **Team-Wide Config** — A committed `.gitowl.toml` sets severity thresholds and ignored paths for the whole repo. |
| 💸 | **Cost & Latency Tracking** — Every review reports token usage, estimated cost, and latency. No surprises on the bill. |
| 🔌 | **Provider-Agnostic** — Works with any OpenAI-compatible provider. Bring whichever API key you already have. |
| 📊 | **Evaluation Harness** — Precision / recall / F1 measured against a seeded-bug corpus, so quality is a number, not a vibe. |

---

## ⚡ Add GitOwl to your repo in 3 steps

Get automated AI reviews on every pull request:

**1. Add the workflow** — copy
[`examples/gitowl-review.yml`](examples/gitowl-review.yml) into your repository at
`.github/workflows/gitowl-review.yml`:

```yaml
- name: Install GitOwl
  run: pip install gitowl

- name: Review the pull request
  env:
    AI_API_KEY: ${{ secrets.AI_API_KEY }}
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: gitowl review-pr "${{ github.repository }}" "${{ github.event.pull_request.number }}" --post
```

**2. Add your API key** — in your repo, go to
*Settings → Secrets and variables → Actions* and add a secret named `AI_API_KEY`.
Use a key from **any OpenAI-compatible provider** you already have.

**3. Open a pull request** — GitOwl reviews the diff and posts its comment
automatically. That's it.

> [!NOTE]
> Want static analysis alongside the AI review? Install with
> `pip install "gitowl[semgrep]"`.

---

## 🛠️ Tech Stack

| Layer | Tools |
|---|---|
| **Core engine** | Python 3.11+, `httpx`, `unidiff` |
| **AI layer** | Provider-agnostic (any OpenAI-compatible API) |
| **Static analysis** | Semgrep (optional, auto-detected) |
| **Distribution** | PyPI package + GitHub Action, published via PyPI Trusted Publishing (OIDC) |
| **Playground** | React + Vite + TypeScript frontend, Python serverless API — deployed on Vercel |
| **Quality** | `pytest` (166 tests), `ruff`, `black`, `isort`, strict `mypy`, `pre-commit`, CI on every PR |

---

## 📦 Install & use locally

```bash
pip install gitowl          # or:  pip install "gitowl[semgrep]"
```

Point it at a diff or a live pull request:

```bash
# Review a diff — from a file, or piped from git
gitowl review-diff my.diff
git diff main...HEAD | gitowl review-diff -

# Review a GitHub PR and post the comment
gitowl review-pr owner/repo 42 --post

# ...and attach one-click fix suggestions inline
gitowl review-pr owner/repo 42 --post --suggest

# Auto-generate a PR description from the diff
gitowl describe-pr owner/repo 42 --post
```

Configure your provider once via environment variables (or a local `.env`):

```bash
AI_API_KEY=your_key_here          # any OpenAI-compatible provider
AI_MODEL=your-model-name          # e.g. a fast, low-cost chat model
AI_PROVIDER=openrouter            # openrouter | openai | ollama
```

> [!IMPORTANT]
> **API Security**
> API keys are read only from the environment / `.env` (which is git-ignored) — never from committed config. They never touch the repository.

---

## ⚙️ Configuration (`.gitowl.toml`)

Drop a `.gitowl.toml` at your repo root to set project-wide review policy. It's
committed, so the whole team shares the same rules:

```toml
[review]
min_severity = "warning"                       # info | warning | error
ignore_paths = ["tests/**", "**/*.md"]         # globs GitOwl won't flag

[ai]
model = "your-model-name"                      # pin a model for this repo
```

**Precedence** (low → high): built-in defaults → `.gitowl.toml` → environment
variables. The repo file sets the baseline; a CI secret or shell `export` always
wins for a single run. API keys are never read from this file.

---

## 🏗️ How it's built

GitOwl ships as three coordinated pieces:

- **A Python package** (`gitowl`) — the review engine: diff parsing, an
  optional Semgrep pass, a provider-agnostic AI layer, risk scoring, and the
  comment renderer. Published to PyPI.
- **A GitHub Action** — wires the engine into the `pull_request` lifecycle and
  posts / updates the review comment (and, optionally, inline suggestions).
- **A web playground** — a React + Vite front end over a Python serverless API,
  so anyone can try a review from the browser. Deployed on Vercel at
  **[gitowl.vercel.app](https://gitowl.vercel.app)**.

Quality is enforced in CI on every pull request: 166 tests, linting, strict type
checking, and an **evaluation harness** that scores review quality (precision /
recall / F1) against a corpus of diffs with known seeded bugs — so changes to
prompts or models can be measured, not guessed.

```bash
pytest --cov=gitowl      # tests
ruff check gitowl tests  # lint
mypy gitowl              # strict type checking
python -m gitowl.eval    # measure review quality (offline, no key)
```

---

## 📄 License

This project is licensed under the **[MIT License](LICENSE)** — free to use, modify, and build on.

---

## 👨‍💻 Built By
**Manthan Dubey**  
*Designed for precision, low noise, and a seamless developer experience.*
