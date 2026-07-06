import { useState } from "react";
import GlitchText from "./GlitchText";

const WORKFLOW_LINES = [
  { type: "comment", text: "# .github/workflows/gitowl-review.yml" },
  { type: "key", text: "name:", val: " GitOwl Review" },
  { type: "key", text: "on:" },
  { type: "indent1", text: "pull_request:" },
  { type: "indent2", text: "types: [opened, synchronize, reopened]" },
  { type: "key", text: "permissions:" },
  { type: "indent1", text: "contents: read" },
  { type: "indent1", text: "pull-requests: write" },
  { type: "key", text: "jobs:" },
  { type: "indent1", text: "review:" },
  { type: "indent2", text: "runs-on: ubuntu-latest" },
  { type: "indent2", text: "steps:" },
  { type: "indent3", text: "- uses: actions/checkout@v4" },
  { type: "indent4", text: "with: { fetch-depth: 0 }" },
  { type: "indent3", text: "- uses: actions/setup-python@v5" },
  { type: "indent4", text: 'with: { python-version: "3.11" }' },
  { type: "indent3", text: "- run: pip install gitowl" },
  { type: "indent3", text: "- if: ${{ secrets.AI_API_KEY != '' }}" },
  { type: "indent4", text: "env:" },
  { type: "indent5", text: "AI_API_KEY: ${{ secrets.AI_API_KEY }}" },
  { type: "indent5", text: "GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}" },
  { type: "indent4", text: 'run: gitowl review-pr "${{ github.repository }}"' },
  { type: "indent5", text: '"${{ github.event.pull_request.number }}" --post' },
];

const WORKFLOW_RAW = `# .github/workflows/gitowl-review.yml
name: GitOwl Review
on:
  pull_request:
    types: [opened, synchronize, reopened]
permissions:
  contents: read
  pull-requests: write
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-python@v5
        with: { python-version: "3.11" }
      - run: pip install gitowl
      - if: \${{ secrets.AI_API_KEY != '' }}
        env:
          AI_API_KEY: \${{ secrets.AI_API_KEY }}
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        run: gitowl review-pr "\${{ github.repository }}" "\${{ github.event.pull_request.number }}" --post`;

function lineColor(type: string) {
  if (type === "comment") return "var(--term-comment, #6a9955)";
  if (type === "key") return "var(--term-key, #9cdcfe)";
  return "var(--term-val, #ce9178)";
}

export function Setup() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(WORKFLOW_RAW);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <section className="setup">
      <GlitchText
        speed={1}
        enableShadows={true}
        enableOnHover={false}
        className="setup-heading"
      >
        Use it on your own repo
      </GlitchText>
      <p>Get automated AI review comments on every pull request — 3 steps:</p>
      <ol className="setup-steps">
        <li>
          <strong>Copy the workflow</strong> below into your repo at{" "}
          <code>.github/workflows/gitowl-review.yml</code>.
        </li>
        <li>
          <strong>Add a secret</strong> <code>AI_API_KEY</code> (your OpenRouter or OpenAI key)
          under <em>Settings → Secrets and variables → Actions</em>.
        </li>
        <li>
          <strong>Open a pull request</strong> — GitOwl reviews the diff and comments automatically.
        </li>
      </ol>

      {/* Terminal UI */}
      <div className="terminal-window">
        <div className="terminal-titlebar">
          <span className="term-dot red" />
          <span className="term-dot yellow" />
          <span className="term-dot green" />
          <span className="terminal-filename">gitowl-review.yml</span>
          <button className="term-copy-btn" onClick={handleCopy} title="Copy to clipboard">
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
        <div className="terminal-body">
          <div className="terminal-line-numbers">
            {WORKFLOW_LINES.map((_, i) => (
              <span key={i} className="line-number">{i + 1}</span>
            ))}
          </div>
          <pre className="terminal-code">
            {WORKFLOW_LINES.map((line, i) => {
              const indent = line.type.startsWith("indent")
                ? parseInt(line.type.replace("indent", ""), 10) * 2
                : 0;
              return (
                <div key={i} className="terminal-code-line">
                  <span style={{ marginLeft: `${indent}ch`, color: lineColor(line.type) }}>
                    {line.text}
                    {line.val && <span style={{ color: "var(--term-val, #ce9178)" }}>{line.val}</span>}
                  </span>
                </div>
              );
            })}
          </pre>
        </div>
      </div>

      <p className="setup-note">
        Defaults to OpenRouter + <code>openai/gpt-4o-mini</code>. Want static analysis too? Use{" "}
        <code>pip install "gitowl[semgrep]"</code>.
      </p>
    </section>
  );
}
