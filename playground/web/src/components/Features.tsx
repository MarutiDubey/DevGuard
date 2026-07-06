import Shuffle from "./Shuffle";
import SpotlightCard from "./SpotlightCard";
import { 
  IconTarget, 
  IconLock, 
  IconPencil, 
  IconFileText, 
  IconSettings, 
  IconCurrencyDollar 
} from "@tabler/icons-react";

const FEATURES = [
  {
    icon: <IconTarget size={32} stroke={1.5} />,
    title: "Risk scoring",
    body: "Every PR gets a Low / Medium / High risk score based on what changed and how risky those changes are.",
    spotlight: "rgba(99, 102, 241, 0.18)",
  },
  {
    icon: <IconLock size={32} stroke={1.5} />,
    title: "Security & bug findings",
    body: "Catches weak hashing, injection risks, hardcoded secrets, and logic bugs — with clear reasoning.",
    spotlight: "rgba(167, 139, 250, 0.18)",
  },
  {
    icon: <IconPencil size={32} stroke={1.5} />,
    title: "One-click fixes",
    body: "Confident fixes are posted as inline GitHub suggestions you can commit in one click.",
    spotlight: "rgba(56, 189, 248, 0.18)",
  },
  {
    icon: <IconFileText size={32} stroke={1.5} />,
    title: "Auto PR descriptions",
    body: "Generate a clear title, summary, and change list from the diff automatically.",
    spotlight: "rgba(99, 102, 241, 0.18)",
  },
  {
    icon: <IconSettings size={32} stroke={1.5} />,
    title: "Configurable policy",
    body: "A .gitowl.toml sets severity thresholds and ignored paths for the whole team.",
    spotlight: "rgba(244, 114, 182, 0.15)",
  },
  {
    icon: <IconCurrencyDollar size={32} stroke={1.5} />,
    title: "Cost & latency tracking",
    body: "Each review shows token usage, estimated cost, and latency — no surprises on your bill.",
    spotlight: "rgba(167, 139, 250, 0.18)",
  },
];

export function Features() {
  return (
    <section className="features">
      <Shuffle
        text="What GitOwl does"
        tag="h2"
        className="features-heading"
        shuffleDirection="right"
        duration={1.2}
        animationMode="evenodd"
        shuffleTimes={2}
        ease="power3.out"
        stagger={0.13}
        threshold={0.1}
        triggerOnce={true}
        triggerOnHover={false}
        respectReducedMotion={false}
        textAlign="left"
        scrambleCharset="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*"
        loop={true}
        loopDelay={2}
      />
      <div className="features-grid">
        {FEATURES.map((f) => (
          <SpotlightCard key={f.title} spotlightColor={f.spotlight} className="feature-spotlight">
            <div className="feature-icon" aria-hidden="true">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </SpotlightCard>
        ))}
      </div>
    </section>
  );
}
