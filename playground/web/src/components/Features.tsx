const FEATURES = [
  {
    icon: "🎯",
    title: "Risk scoring",
    body: "Every PR gets a Low / Medium / High risk score based on what changed and how.",
  },
  {
    icon: "🔒",
    title: "Security & bug findings",
    body: "Catches weak hashing, injection risks, hardcoded secrets, and logic bugs — with reasoning.",
  },
  {
    icon: "✍️",
    title: "One-click fixes",
    body: "Confident fixes are posted as inline GitHub suggestions you can commit in one click.",
  },
  {
    icon: "📝",
    title: "Auto PR descriptions",
    body: "Generate a clear title, summary, and change list from the diff with /describe.",
  },
  {
    icon: "⚙️",
    title: "Configurable policy",
    body: "A .gitowl.toml sets severity thresholds and ignored paths for the whole team.",
  },
  {
    icon: "💸",
    title: "Cost & latency tracking",
    body: "Each review shows token usage, estimated cost, and latency — no surprises.",
  },
];

export function Features() {
  return (
    <section className="features">
      <h2>What GitOwl does</h2>
      <div className="features-grid">
        {FEATURES.map((f) => (
          <div className="feature" key={f.title}>
            <div className="feature-icon" aria-hidden="true">
              {f.icon}
            </div>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
