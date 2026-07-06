import { useEffect, useRef } from "react";
import ScrollFloat from "./ScrollFloat";
import BorderGlow from "./BorderGlow";

const STEPS = [
  {
    n: "01",
    title: "Open a pull request",
    body: "GitOwl automatically triggers on every PR — opened, updated, or reopened. No configuration needed beyond the workflow file.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="6" cy="6" r="2.5" />
        <circle cx="6" cy="18" r="2.5" />
        <circle cx="18" cy="6" r="2.5" />
        <path d="M6 8.5v7M8.5 6h5a4 4 0 0 1 4 4v2" strokeLinecap="round" />
        <path d="M15.5 9.5l2.5-3.5 2.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: "#6366f1",
    glow: "rgba(99,102,241,0.3)",
    tag: "Trigger",
  },
  {
    n: "02",
    title: "AI scans the diff",
    body: "It reads every changed line, flags real bugs and security risks, filters noise and false positives, then produces a confidence-scored risk assessment.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M7 8h4M7 12h8M7 16h5" strokeLinecap="round" />
        <circle cx="18" cy="18" r="4" fill="var(--bg)" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16.5 18l1 1 2-2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.3)",
    tag: "Analysis",
  },
  {
    n: "03",
    title: "A structured comment lands",
    body: "GitOwl posts a clean review directly on the PR — a risk badge, a ranked findings list, and one-click fix suggestions. Your team sees exactly what matters.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M9 10h.01M12 10h.01M15 10h.01" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    color: "#38bdf8",
    glow: "rgba(56,189,248,0.3)",
    tag: "Result",
  },
];

export function HowItWorks() {
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    stepRefs.current.forEach((el, i) => {
      if (!el) return;
      const delay = i * 120;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => el.classList.add("how-step-visible"), delay);
            obs.disconnect();
          }
        },
        { threshold: 0.2 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    // Connector line ke fill hone ka animation
    if (fillRef.current) {
      const lineObs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            fillRef.current!.classList.add("how-line-active");
            lineObs.disconnect();
          }
        },
        { threshold: 0.05 }
      );
      lineObs.observe(fillRef.current);
      observers.push(lineObs);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <section className="how">
      <div className="how-header">
        <ScrollFloat
          animationDuration={1}
          ease="back.out(1.4)"
          stagger={0.04}
          textClassName="how-heading"
        >
          How it works
        </ScrollFloat>
        <p className="how-sub">
          Zero config. Plugs into your existing GitHub workflow in minutes.
        </p>
      </div>

      <div className="how-timeline">
        {/* Vertical connector line */}
        <div className="how-connector">
          <div className="how-connector-fill" ref={fillRef} />
        </div>

        {STEPS.map((s, i) => (
          <div
            key={s.n}
            className={`how-timeline-row ${i % 2 === 1 ? "how-row-reverse" : ""}`}
            ref={(el) => { stepRefs.current[i] = el; }}
          >
            {/* Card */}
            <BorderGlow 
              className="how-card" 
              style={{ "--step-color": s.color, "--step-glow": s.glow, "--card-bg": "#0d1117" } as React.CSSProperties}
              glowColor={s.color}
              borderRadius={16}
              glowRadius={60}
              glowIntensity={1.2}
              animated={true}
            >
              <div className="how-card-tag">{s.tag}</div>
              <div className="how-card-icon" style={{ color: s.color }}>
                {s.icon}
              </div>
              <h3 className="how-card-title">{s.title}</h3>
              <p className="how-card-body">{s.body}</p>
            </BorderGlow>

            {/* Center node */}
            <div className="how-node" style={{ "--step-color": s.color } as React.CSSProperties}>
              <span className="how-node-num">{s.n}</span>
            </div>

            {/* Spacer (keeps the zig-zag symmetric) */}
            <div className="how-spacer" />
          </div>
        ))}
      </div>
    </section>
  );
}
