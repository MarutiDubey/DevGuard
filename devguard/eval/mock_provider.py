"""Deterministic mock AI provider for the eval harness.

This provider does **not** call any model. It rediscovers seeded bugs by scanning
the diff's added lines for well-known dangerous patterns, emitting a
:class:`~devguard.models.Finding` (with a correctly-tracked file/line) for each.

Why a pattern-matching mock rather than one that reads the answer key: a mock
that echoed the expected bugs would always score 100% and validate nothing. This
one independently finds bugs from the diff, so precision/recall land below 1.0
and the scoring math is genuinely exercised. It deliberately has **no detector
for ``subprocess(..., shell=True)``**, making that seeded category a guaranteed
false negative — which is exactly what proves the harness counts FN correctly.

Importing this module registers the ``eval-mock`` provider as a side-effect.
"""

from __future__ import annotations

import re

from devguard.ai_client.base import AIProvider
from devguard.ai_client.registry import register_provider
from devguard.models import Finding, FindingSource, ReviewResult, RiskLevel, Severity

#: (compiled pattern, title, message) for each bug the mock can detect.
#: Intentionally omits subprocess(shell=True) so it stays a false negative.
_DETECTORS: list[tuple[re.Pattern[str], str, str]] = [
    (
        re.compile(r"hashlib\.md5\s*\("),
        "Weak hash (MD5)",
        "MD5 is cryptographically broken; use a modern hash for security.",
    ),
    (
        re.compile(r"\beval\s*\("),
        "Use of eval()",
        "eval() on untrusted input allows arbitrary code execution.",
    ),
    (
        re.compile(r"""(?i)\b(password|secret|api_key|token)\b\s*=\s*['"]"""),
        "Hardcoded secret",
        "A credential appears to be hardcoded; load it from configuration.",
    ),
    (
        re.compile(
            r"""(execute|query)\s*\(\s*f?['"].*%s.*['"]\s*%|""" r"""(execute|query)\s*\(\s*f['"]"""
        ),
        "Possible SQL injection",
        "Query built via string formatting; use parameterized queries.",
    ),
    (
        re.compile(r"\bpickle\.loads\s*\("),
        "Unsafe deserialization",
        "pickle.loads on untrusted data can execute arbitrary code.",
    ),
]

_HUNK_RE = re.compile(r"^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@")


@register_provider
class MockProvider(AIProvider):
    """Offline, deterministic provider used by the eval harness."""

    name = "eval-mock"

    def review(self, diff: str, findings: list[Finding]) -> ReviewResult:
        detected = _scan(diff)
        risk = RiskLevel.HIGH if detected else RiskLevel.LOW
        summary = (
            f"Mock review: {len(detected)} issue(s) detected."
            if detected
            else "Mock review: no issues detected."
        )
        return ReviewResult(summary=summary, risk=risk, findings=detected)


def _scan(diff: str) -> list[Finding]:
    """Walk the diff, tracking file + new-side line, emit findings on + lines."""
    findings: list[Finding] = []
    current_file: str | None = None
    new_line = 0

    for line in diff.splitlines():
        if line.startswith("+++ "):
            path = line[4:].strip()
            current_file = None if path == "/dev/null" else path.removeprefix("b/")
            continue
        if line.startswith("---"):
            # Old-file header — ignore; do not treat as a removed body line.
            continue
        hunk = _HUNK_RE.match(line)
        if hunk:
            new_line = int(hunk.group(1))
            continue
        if line.startswith("+"):
            content = line[1:]
            for pattern, title, message in _DETECTORS:
                if pattern.search(content):
                    findings.append(
                        Finding(
                            source=FindingSource.AI,
                            severity=Severity.ERROR,
                            title=title,
                            message=message,
                            file=current_file,
                            line=new_line,
                        )
                    )
                    break  # at most one finding per line
            new_line += 1
        elif line.startswith("-"):
            # Removed line: exists only on the old side; do not advance new_line.
            continue
        else:
            # Context line (leading space) or metadata: advances the new side.
            new_line += 1

    return findings
