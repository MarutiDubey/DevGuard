"""DevGuard eval harness.

Scores DevGuard's review output against a corpus of diffs with *known* seeded
bugs, reporting precision/recall/F1. Runs deterministically offline via the
``eval-mock`` provider by default, or against a real provider (see
``__main__``).

Importing this package registers the mock provider as a side-effect.
"""

from __future__ import annotations

import json
from pathlib import Path

from devguard.config import Config
from devguard.eval import mock_provider  # noqa: F401 - registers eval-mock provider
from devguard.eval.scoring import (
    CaseResult,
    EvalCase,
    EvalReport,
    ExpectedBug,
    aggregate,
    score_case,
)
from devguard.logging_config import get_logger
from devguard.reviewer import review_diff

logger = get_logger(__name__)

CASES_DIR = Path(__file__).parent / "cases"


def load_cases(cases_dir: Path) -> list[EvalCase]:
    """Load every ``<name>.diff`` + ``<name>.expected.json`` pair in a dir.

    Raises :class:`FileNotFoundError` if a ``.diff`` has no matching
    ``.expected.json`` — a forgotten label file must fail loud, not silently
    drop the case from the corpus.
    """
    cases: list[EvalCase] = []
    for diff_path in sorted(cases_dir.glob("*.diff")):
        expected_path = diff_path.with_suffix(".expected.json")
        if not expected_path.is_file():
            raise FileNotFoundError(f"'{diff_path.name}' has no matching '{expected_path.name}'")
        manifest = json.loads(expected_path.read_text(encoding="utf-8"))
        expected = [
            ExpectedBug(
                file=bug["file"],
                line=bug.get("line"),
                kind=bug.get("kind"),
                line_tolerance=bug.get("line_tolerance", 2),
            )
            for bug in manifest.get("bugs", [])
        ]
        cases.append(
            EvalCase(
                name=diff_path.stem,
                diff=diff_path.read_text(encoding="utf-8"),
                description=manifest.get("description", ""),
                expected=expected,
            )
        )
    return cases


def run_eval(cases_dir: Path, config: Config) -> EvalReport:
    """Review every case with ``config``'s provider and score the findings.

    Mock vs live is fully determined by ``config.ai.provider`` — this function
    takes no separate flag. Semgrep is disabled so the score reflects the AI
    layer alone.
    """
    cases = load_cases(cases_dir)
    results: list[CaseResult] = []
    for case in cases:
        review = review_diff(case.diff, config, semgrep_findings=[])
        result = score_case(case, review.result.findings)
        logger.info(
            "case %s: tp=%d fp=%d fn=%d",
            result.name,
            result.match.tp,
            result.match.fp,
            result.match.fn,
        )
        results.append(result)
    return EvalReport(cases=results, aggregate=aggregate(results))
