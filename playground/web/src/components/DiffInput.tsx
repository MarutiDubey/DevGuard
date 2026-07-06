import { useRef, UIEvent, useMemo } from "react";
import { EXAMPLES, type Example } from "../api";

interface DiffInputProps {
  diff: string;
  onChange: (diff: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

const RISK_DOT: Record<Example["expectedRisk"], string> = {
  high: "🔴",
  medium: "🟡",
  low: "🔵",
  clean: "🟢",
};

export function DiffInput({ diff, onChange, onSubmit, loading }: DiffInputProps) {
  const preRef = useRef<HTMLPreElement>(null);

  const handleScroll = (e: UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const highlightedLines = useMemo(() => {
    if (!diff) return null;
    return diff.split("\n").map((line, i) => {
      let className = "diff-line";
      if (line.startsWith("+") && !line.startsWith("+++")) {
        className += " diff-add";
      } else if (line.startsWith("-") && !line.startsWith("---")) {
        className += " diff-remove";
      } else if (line.startsWith("@@")) {
        className += " diff-meta";
      } else if (line.startsWith("diff --git") || line.startsWith("index ") || line.startsWith("+++") || line.startsWith("---")) {
        className += " diff-header";
      }
      return (
        <span key={i} className={className}>
          {line || " "}
        </span>
      );
    });
  }, [diff]);

  return (
    <>
      <div className="examples">
        <span className="examples-label">Try an example:</span>
        {EXAMPLES.map((ex) => (
          <button
            type="button"
            key={ex.label}
            className="chip"
            onClick={() => onChange(ex.diff)}
            disabled={loading}
            title={ex.blurb}
          >
            <span className="chip-dot" aria-hidden="true">
              {RISK_DOT[ex.expectedRisk]}
            </span>
            {ex.label}
          </button>
        ))}
      </div>

      <div className="code-editor-wrapper">
        <div className="code-editor-header">
          <div className="editor-dots">
            <span className="editor-dot red"></span>
            <span className="editor-dot yellow"></span>
            <span className="editor-dot green"></span>
          </div>
          <span className="editor-title">diff.patch</span>
        </div>
        
        <div className="diff-editor-container">
          <pre ref={preRef} aria-hidden="true">
            {highlightedLines}
            {/* Add an extra line at the end to match textarea behavior when ending with newline */}
            {diff.endsWith("\n") ? <span className="diff-line"> </span> : null}
          </pre>
          <textarea
            value={diff}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            placeholder="…or paste a unified diff (git diff output) here"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="actions">
        <button type="button" onClick={onSubmit} disabled={loading || !diff.trim()}>
          {loading ? "Reviewing…" : "Review"}
        </button>
      </div>
    </>
  );
}
