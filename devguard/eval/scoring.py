"""Precision/recall scoring for the eval harness — pure, no I/O.

Compares DevGuard's emitted :class:`~devguard.models.Finding` list against a
ground-truth manifest of seeded bugs and produces precision/recall/F1.

Matching is deterministic: a finding is a candidate true positive for an
expected bug when the file matches and the line rule holds (see :func:`match`).
Each expected bug matches at most one finding and vice-versa, resolved by a
fixed greedy pass so results are reproducible.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from devguard.models import Finding

DEFAULT_LINE_TOLERANCE = 2


@dataclass
class ExpectedBug:
    """A single ground-truth seeded bug from a case's ``.expected.json``."""

    file: str
    line: int | None = None
    #: Metadata/documentation only — never used in matching or scoring.
    kind: str | None = None
    line_tolerance: int = DEFAULT_LINE_TOLERANCE


@dataclass
class EvalCase:
    """One corpus case: a diff plus its expected bugs."""

    name: str
    diff: str
    description: str
    expected: list[ExpectedBug] = field(default_factory=list)


@dataclass
class Match:
    """Raw confusion counts from matching findings against expected bugs."""

    tp: int
    fp: int
    fn: int


@dataclass
class Metrics:
    """Precision/recall/F1 derived from confusion counts."""

    precision: float
    recall: float
    f1: float

    @classmethod
    def from_counts(cls, tp: int, fp: int, fn: int) -> Metrics:
        precision = tp / (tp + fp) if (tp + fp) else 0.0
        recall = tp / (tp + fn) if (tp + fn) else 0.0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0
        return cls(precision=precision, recall=recall, f1=f1)


@dataclass
class CaseResult:
    """The scored outcome for a single case."""

    name: str
    match: Match
    metrics: Metrics


@dataclass
class EvalReport:
    """Full harness output: per-case results plus a micro-averaged aggregate."""

    cases: list[CaseResult]
    aggregate: Metrics


def _line_ok(expected: ExpectedBug, finding: Finding) -> bool:
    """Apply the line rule for a candidate (file already known to match)."""
    if expected.line is None:
        # Expected bug has no specific line — file match alone qualifies.
        return True
    if finding.line is None:
        # A locationless finding can only match a locationless expected bug.
        return False
    return abs(finding.line - expected.line) <= expected.line_tolerance


def match(expected: list[ExpectedBug], findings: list[Finding]) -> Match:
    """Greedily match findings to expected bugs and return confusion counts.

    Deterministic: expected bugs are considered in declaration order; for each,
    the first still-unmatched finding (findings in list order) that satisfies
    the file + line rule is claimed. Unmatched findings are false positives;
    unmatched expected bugs are false negatives.
    """
    used: set[int] = set()
    tp = 0
    for exp in expected:
        for i, finding in enumerate(findings):
            if i in used:
                continue
            if finding.file == exp.file and _line_ok(exp, finding):
                used.add(i)
                tp += 1
                break
    fp = len(findings) - len(used)
    fn = len(expected) - tp
    return Match(tp=tp, fp=fp, fn=fn)


def score_case(case: EvalCase, findings: list[Finding]) -> CaseResult:
    """Score one case's findings against its expected bugs."""
    m = match(case.expected, findings)
    return CaseResult(
        name=case.name,
        match=m,
        metrics=Metrics.from_counts(m.tp, m.fp, m.fn),
    )


def aggregate(results: list[CaseResult]) -> Metrics:
    """Micro-average metrics across cases (sum counts, then compute)."""
    tp = sum(r.match.tp for r in results)
    fp = sum(r.match.fp for r in results)
    fn = sum(r.match.fn for r in results)
    return Metrics.from_counts(tp, fp, fn)
