"""Prompt construction and response parsing shared by AI providers.

The model is asked to return strict JSON so we can parse it deterministically.
"""

from __future__ import annotations

import json

from gitowl.models import Finding, FindingSource, PrDescription, ReviewResult, RiskLevel, Severity

SYSTEM_PROMPT = (
    "You are GitOwl, an expert code reviewer. You are given a unified diff "
    "from a GitHub pull request (wrapped in <diff> tags) and, optionally, findings from the Semgrep "
    "static analyser. Your job:\n"
    "  1. Filter out Semgrep findings that are false positives given the diff context.\n"
    "  2. Add your own reasoning-based observations (bugs, security issues, "
    "risky changes) that a static analyser would miss. If the finding is a security "
    "vulnerability, explicitly cite the relevant OWASP Top 10 category in the message.\n"
    "  3. Assign an overall risk score: Low, Medium, or High.\n\n"
    "Respond with STRICT JSON only — no markdown, no prose outside the JSON. "
    "Use exactly this schema:\n"
    "{\n"
    '  "summary": "<2-4 sentence overview of the change and its risk>",\n'
    '  "risk": "Low|Medium|High",\n'
    '  "findings": [\n'
    '    {"severity": "info|warning|error", "title": "<short>", '
    '"message": "<explanation + suggested fix>", "file": "<path or null>", '
    '"line": <int or null>, '
    '"suggestion": "<replacement code for that line, or null>"}\n'
    "  ],\n"
    '  "dismissed_rule_ids": ["<semgrep rule_id you judged a false positive>"]\n'
    "}\n\n"
    "For 'suggestion': provide the corrected code ONLY when you are confident of "
    "a concrete, drop-in replacement for the flagged line(s) — just the code, no "
    "fences or prose. Use null when a fix is unclear or spans many lines."
)


def build_user_prompt(diff: str, findings: list[Finding]) -> str:
    """Assemble the user message containing the diff and Semgrep findings."""
    parts = ["## Unified diff\n", "<diff>", diff.strip(), "</diff>", ""]
    if findings:
        parts.append("## Semgrep findings (verify these; some may be false positives)")
        for f in findings:
            rule = f.rule_id or "unknown-rule"
            parts.append(f"- [{rule}] {f.location()} — {f.severity.value}: {f.message}")
    else:
        parts.append("## Semgrep findings\n(none)")
    parts.append("\nReturn the JSON review now.")
    return "\n".join(parts)


def _extract_json(content: str) -> dict:
    """Pull a JSON object out of a model response, tolerating fences/prose.

    We locate the outermost ``{ ... }`` span, which naturally skips any leading
    ```json fence label and any prose the model wrapped around the object.
    """
    start = content.find("{")
    end = content.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError("no JSON object found in model response")
    return json.loads(content[start : end + 1])


def _coerce_risk(value: object) -> RiskLevel:
    text = str(value).strip().capitalize()
    try:
        return RiskLevel(text)
    except ValueError:
        return RiskLevel.MEDIUM


def _coerce_severity(value: object) -> Severity:
    text = str(value).strip().lower()
    try:
        return Severity(text)
    except ValueError:
        return Severity.WARNING


def _clean_suggestion(value: object) -> str | None:
    """Normalise a raw ``suggestion`` value into replacement code, or None.

    The schema asks for bare code, but models sometimes wrap it in ``` fences
    anyway — strip those so the comment renderer can build its own suggestion
    block. Empty / null / non-string values become None.
    """
    if not isinstance(value, str):
        return None
    text = value.strip()
    if not text or text.lower() in ("null", "none"):
        return None
    if text.startswith("```"):
        lines = text.splitlines()
        # Drop the opening fence (possibly ```lang) and a trailing fence.
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text or None


def parse_review_response(content: str, semgrep_findings: list[Finding]) -> ReviewResult:
    """Parse the model's JSON response into a :class:`ReviewResult`.

    Semgrep findings whose ``rule_id`` appears in ``dismissed_rule_ids`` are
    moved to ``dismissed`` rather than reported.
    """
    data = _extract_json(content)

    ai_findings: list[Finding] = []
    for raw in data.get("findings", []) or []:
        if not isinstance(raw, dict):
            continue
        line = raw.get("line")
        ai_findings.append(
            Finding(
                source=FindingSource.AI,
                severity=_coerce_severity(raw.get("severity", "warning")),
                title=str(raw.get("title", "Observation")),
                message=str(raw.get("message", "")),
                file=(str(raw["file"]) if raw.get("file") else None),
                line=(int(line) if isinstance(line, int | str) and str(line).isdigit() else None),
                suggestion=_clean_suggestion(raw.get("suggestion")),
            )
        )

    dismissed_ids = {str(r) for r in (data.get("dismissed_rule_ids") or [])}
    kept: list[Finding] = []
    dismissed: list[Finding] = []
    for f in semgrep_findings:
        (dismissed if f.rule_id in dismissed_ids else kept).append(f)

    return ReviewResult(
        summary=str(data.get("summary", "")).strip() or "No summary provided.",
        risk=_coerce_risk(data.get("risk", "Medium")),
        findings=kept + ai_findings,
        dismissed=dismissed,
    )


DESCRIBE_SYSTEM_PROMPT = (
    "You are GitOwl. You are given a unified diff from a GitHub pull request "
    "(wrapped in <diff> tags). "
    "Write a clear, concise pull-request description a reviewer can read at a "
    "glance. Describe what the change does and why — do NOT review it or flag "
    "issues.\n\n"
    "Respond with STRICT JSON only — no markdown, no prose outside the JSON. "
    "Use exactly this schema:\n"
    "{\n"
    '  "title": "<one-line imperative PR title, <=70 chars>",\n'
    '  "summary": "<2-4 sentence overview of what changed and why>",\n'
    '  "changes": ["<notable change>", "<notable change>"]\n'
    "}\n\n"
    "Keep 'changes' to the handful of things that matter; omit trivia. Base "
    "everything on the diff only — do not invent changes it does not contain."
)


def build_describe_prompt(diff: str) -> str:
    """Assemble the user message asking for a PR description of ``diff``."""
    return "\n".join(
        [
            "## Unified diff\n",
            "<diff>",
            diff.strip(),
            "</diff>",
            "",
            "Return the JSON description now.",
        ]
    )


def parse_describe_response(content: str) -> PrDescription:
    """Parse the model's JSON response into a :class:`PrDescription`."""
    data = _extract_json(content)

    raw_changes = data.get("changes") or []
    changes = [c.strip() for c in raw_changes if isinstance(c, str) and c.strip()]

    return PrDescription(
        title=str(data.get("title", "")).strip() or "Update",
        summary=str(data.get("summary", "")).strip() or "No summary provided.",
        changes=changes,
    )
