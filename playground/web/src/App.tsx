import { useState } from "react";
import { DiffInput } from "./components/DiffInput";
import { ReviewOutput } from "./components/ReviewOutput";
import { HowItWorks } from "./components/HowItWorks";
import { Screenshot } from "./components/Screenshot";
import { Features } from "./components/Features";
import { Setup } from "./components/Setup";
import { reviewDiff, ReviewApiError, EXAMPLE_DIFF, type ReviewResponse } from "./api";

const REPO_URL = "https://github.com/MarutiDubey/GitOwl";

function App() {
  const [diff, setDiff] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReview() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await reviewDiff(diff);
      setResult(res);
    } catch (err) {
      const message = err instanceof ReviewApiError ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleExample() {
    setDiff(EXAMPLE_DIFF);
    setResult(null);
    setError(null);
  }

  return (
    <>
      <header className="site-header">
        <div className="logo-row">
          <div className="owl-icon" aria-hidden="true">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="50" fill="#1e3a8a"/>
              <ellipse cx="50" cy="62" rx="20" ry="22" fill="white"/>
              <circle cx="40" cy="44" r="11" fill="white"/>
              <circle cx="60" cy="44" r="11" fill="white"/>
              <circle cx="40" cy="44" r="5" fill="#1e3a8a"/>
              <circle cx="60" cy="44" r="5" fill="#1e3a8a"/>
              <circle cx="42" cy="42" r="1.5" fill="white"/>
              <circle cx="62" cy="42" r="1.5" fill="white"/>
              <polygon points="50,51 46,57 54,57" fill="#1e3a8a"/>
              <polygon points="34,36 30,24 40,32" fill="white"/>
              <polygon points="66,36 70,24 60,32" fill="white"/>
              <ellipse cx="28" cy="66" rx="8" ry="14" fill="white" transform="rotate(-15 28 66)"/>
              <ellipse cx="72" cy="66" rx="8" ry="14" fill="white" transform="rotate(15 72 66)"/>
            </svg>
          </div>
          <span className="site-name">GitOwl</span>
        </div>
        <a
          className="gh-link"
          href="https://github.com/MarutiDubey/GitOwl"
          target="_blank"
          rel="noreferrer"
        >
          GitHub →
        </a>
      </header>

      <div className="hero">
        <span className="badge">AI-assisted code review</span>
        <h1>Smarter PR reviews,<br />on autopilot.</h1>
        <p className="tagline">
          GitOwl reviews every pull request with AI — flagging bugs, security risks, and
          scoring overall risk, then posting it as a comment. Add it to any repo in 3 steps.
        </p>
        <div className="hero-actions">
          <a className="btn-primary" href={REPO_URL} target="_blank" rel="noreferrer">
            Add to your repo
          </a>
          <button onClick={handleExample} className="secondary">
            Try the live demo ↓
          </button>
        </div>
      </div>

      <HowItWorks />

      <Screenshot />

      <section className="try">
        <h2>Try it live</h2>
        <p className="try-sub">
          Paste a diff and see a real GitOwl review right here — no signup, nothing stored.
        </p>
        <DiffInput diff={diff} onChange={setDiff} onSubmit={handleReview} loading={loading} />
        {error && <div className="error-box">{error}</div>}
        {result && <ReviewOutput result={result} />}
      </section>

      <Features />

      <Setup />

      <footer>
        Diffs are sent to an AI provider for review and are not stored.{" "}
        Static analysis (Semgrep) is skipped in this playground — only the AI review layer runs.{" "}
        <a href="https://github.com/MarutiDubey/GitOwl" target="_blank" rel="noreferrer">
          View source on GitHub
        </a>
      </footer>
    </>
  );
}

export default App;
