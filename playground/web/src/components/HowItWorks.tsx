const STEPS = [
  {
    n: "1",
    title: "Open a pull request",
    body: "GitOwl runs automatically as a GitHub Action on every PR — opened, updated, or reopened.",
  },
  {
    n: "2",
    title: "AI reviews the diff",
    body: "It reads the changes, flags bugs and security risks, filters false positives, and scores overall risk.",
  },
  {
    n: "3",
    title: "You get a comment",
    body: "A structured review is posted right on the PR — risk badge, findings, and one-click fix suggestions.",
  },
];

export function HowItWorks() {
  return (
    <section className="how">
      <h2>How it works</h2>
      <div className="how-grid">
        {STEPS.map((s) => (
          <div className="how-step" key={s.n}>
            <div className="how-num">{s.n}</div>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
