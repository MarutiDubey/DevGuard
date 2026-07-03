"""Tests for the eval harness: scoring math, mock determinism, end-to-end."""

from __future__ import annotations

import pytest

from devguard.eval import CASES_DIR, load_cases, run_eval
from devguard.eval.mock_provider import MockProvider, _scan
from devguard.eval.scoring import EvalCase, ExpectedBug, Metrics, aggregate, match, score_case
from devguard.models import Finding, FindingSource, Severity


@pytest.fixture
def sample_case_diff():
    """Return a loader for a packaged corpus diff by case name."""

    def _load(name: str) -> str:
        return (CASES_DIR / f"{name}.diff").read_text(encoding="utf-8")

    return _load


def _finding(file: str | None, line: int | None) -> Finding:
    return Finding(
        source=FindingSource.AI,
        severity=Severity.ERROR,
        title="t",
        message="m",
        file=file,
        line=line,
    )


# --- scoring: match() ----------------------------------------------------


def test_exact_match_is_true_positive():
    m = match([ExpectedBug("a.py", 10)], [_finding("a.py", 10)])
    assert (m.tp, m.fp, m.fn) == (1, 0, 0)


def test_line_within_tolerance_matches():
    m = match([ExpectedBug("a.py", 10, line_tolerance=2)], [_finding("a.py", 12)])
    assert m.tp == 1


def test_line_outside_tolerance_is_fp_and_fn():
    m = match([ExpectedBug("a.py", 10, line_tolerance=2)], [_finding("a.py", 13)])
    assert (m.tp, m.fp, m.fn) == (0, 1, 1)


def test_wrong_file_does_not_match():
    m = match([ExpectedBug("a.py", 10)], [_finding("b.py", 10)])
    assert (m.tp, m.fp, m.fn) == (0, 1, 1)


def test_extra_finding_is_false_positive():
    m = match([ExpectedBug("a.py", 10)], [_finding("a.py", 10), _finding("a.py", 50)])
    assert (m.tp, m.fp, m.fn) == (1, 1, 0)


def test_missed_bug_is_false_negative():
    m = match([ExpectedBug("a.py", 10)], [])
    assert (m.tp, m.fp, m.fn) == (0, 0, 1)


def test_clean_case_with_spurious_finding():
    m = match([], [_finding("a.py", 10)])
    assert (m.tp, m.fp, m.fn) == (0, 1, 0)


def test_none_expected_line_matches_any_line_same_file():
    m = match([ExpectedBug("a.py", None)], [_finding("a.py", 99)])
    assert m.tp == 1


def test_none_finding_line_cannot_match_lined_expected():
    m = match([ExpectedBug("a.py", 10)], [_finding("a.py", None)])
    assert (m.tp, m.fp, m.fn) == (0, 1, 1)


def test_greedy_match_is_one_to_one():
    # Two findings both fit the single expected bug; only one is claimed.
    m = match([ExpectedBug("a.py", 10)], [_finding("a.py", 10), _finding("a.py", 11)])
    assert (m.tp, m.fp, m.fn) == (1, 1, 0)


# --- scoring: Metrics ----------------------------------------------------


def test_metrics_perfect():
    met = Metrics.from_counts(tp=4, fp=0, fn=0)
    assert (met.precision, met.recall, met.f1) == (1.0, 1.0, 1.0)


def test_metrics_divide_by_zero_is_zero():
    met = Metrics.from_counts(tp=0, fp=0, fn=0)
    assert (met.precision, met.recall, met.f1) == (0.0, 0.0, 0.0)


def test_aggregate_micro_averages():
    r1 = score_case(EvalCase("c1", "", "", [ExpectedBug("a.py", 1)]), [_finding("a.py", 1)])
    r2 = score_case(EvalCase("c2", "", "", [ExpectedBug("b.py", 1)]), [])
    agg = aggregate([r1, r2])
    # tp=1, fp=0, fn=1 -> precision 1.0, recall 0.5
    assert agg.precision == 1.0
    assert agg.recall == 0.5


# --- mock provider -------------------------------------------------------


def test_scan_finds_md5_at_correct_line(sample_case_diff):
    findings = _scan(sample_case_diff("weak_hash"))
    assert len(findings) == 1
    assert findings[0].file == "auth/login.py"
    assert findings[0].line == 4


def test_scan_ignores_removed_lines():
    diff = "--- a/x.py\n+++ b/x.py\n@@ -1,2 +1,2 @@\n" "-    bad = eval(x)\n+    good = int(x)\n"
    assert _scan(diff) == []


def test_mock_provider_is_deterministic(sample_case_diff):
    diff = sample_case_diff("sql_injection")
    provider = MockProvider.__new__(MockProvider)  # config unused
    first = provider.review(diff, [])
    second = provider.review(diff, [])
    assert [(f.file, f.line, f.title) for f in first.findings] == [
        (f.file, f.line, f.title) for f in second.findings
    ]
    assert len(first.findings) == 1


def test_mock_does_not_detect_shell_injection(sample_case_diff):
    # The intentionally-missed category: no detector -> guaranteed FN.
    assert _scan(sample_case_diff("shell_injection")) == []


# --- end-to-end ----------------------------------------------------------


def test_run_eval_over_corpus_matches_known_baseline():
    from devguard.eval.__main__ import _mock_config

    report = run_eval(CASES_DIR, _mock_config())
    tp = sum(c.match.tp for c in report.cases)
    fp = sum(c.match.fp for c in report.cases)
    fn = sum(c.match.fn for c in report.cases)
    # 4 detected bugs, shell_injection missed (FN), clean stays clean.
    assert (tp, fp, fn) == (4, 0, 1)
    assert report.aggregate.precision == 1.0
    assert report.aggregate.recall == 0.8


def test_load_cases_raises_on_missing_manifest(tmp_path):
    (tmp_path / "orphan.diff").write_text("diff", encoding="utf-8")
    with pytest.raises(FileNotFoundError):
        load_cases(tmp_path)
