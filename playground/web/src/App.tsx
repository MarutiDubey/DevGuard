import { lazy, Suspense, useState } from "react";
import { motion } from "motion/react";
import { DiffInput } from "./components/DiffInput";
import { ReviewOutput } from "./components/ReviewOutput";
import { HowItWorks } from "./components/HowItWorks";
import { Screenshot } from "./components/Screenshot";
import { Features } from "./components/Features";
import { Setup } from "./components/Setup";
import { reviewDiff, ReviewApiError, EXAMPLE_DIFF, type ReviewResponse } from "./api";
import { CustomCursor } from "./components/CustomCursor";
import ScrollFloat from "./components/ScrollFloat";
import ClickSpark from "./components/ClickSpark";
import BlurText from "./components/BlurText";
import TextType from "./components/TextType";
import GooeyNav from "./components/GooeyNav";
import { ShimmerButton } from "./components/ShimmerButton";
import { LiquidButton } from "./components/LiquidButton";

const REPO_URL = "https://github.com/MarutiDubey/GitOwl";

const NAV_ITEMS = [
  { label: "How it works", href: "#how" },
  { label: "Try it live", href: "#try" },
  { label: "Features", href: "#features" },
  { label: "Setup", href: "#setup" },
];


// WebGL orb — lazy so it never blocks first paint.
const Orb = lazy(() => import("./components/Orb"));

// Stagger children in on load.
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

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
    document.getElementById("try")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <ClickSpark
      sparkColor="rgba(99,160,255,1)"
      sparkSize={14}
      sparkRadius={50}
      sparkCount={8}
      duration={500}
    >
      <CustomCursor />
      <header className="site-header">
        <div className="logo-row">
          <div className="owl-icon" aria-hidden="true">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="50" fill="#1e3a8a" />
              <ellipse cx="50" cy="62" rx="20" ry="22" fill="white" />
              <circle cx="40" cy="44" r="11" fill="white" />
              <circle cx="60" cy="44" r="11" fill="white" />
              <circle cx="40" cy="44" r="5" fill="#1e3a8a" />
              <circle cx="60" cy="44" r="5" fill="#1e3a8a" />
              <circle cx="42" cy="42" r="1.5" fill="white" />
              <circle cx="62" cy="42" r="1.5" fill="white" />
              <polygon points="50,51 46,57 54,57" fill="#1e3a8a" />
              <polygon points="34,36 30,24 40,32" fill="white" />
              <polygon points="66,36 70,24 60,32" fill="white" />
              <ellipse cx="28" cy="66" rx="8" ry="14" fill="white" transform="rotate(-15 28 66)" />
              <ellipse cx="72" cy="66" rx="8" ry="14" fill="white" transform="rotate(15 72 66)" />
            </svg>
          </div>
          <span className="site-name">GitOwl</span>
        </div>
        <GooeyNav
          items={NAV_ITEMS}
          particleCount={12}
          animationTime={500}
          initialActiveIndex={0}
        />
        <a className="gh-link" href={REPO_URL} target="_blank" rel="noreferrer">
          GitHub →
        </a>
      </header>

      {/* ── Hero — full-bleed, orb is NOW interactive foreground ── */}
      <section className="hero">
        {/* Orb: pointer-events on, high hoverIntensity so it reacts */}
        <div className="hero-orb">
          <Suspense fallback={null}>
            <Orb hue={230} hoverIntensity={0.6} backgroundColor="transparent" />
          </Suspense>
        </div>
        <motion.div className="hero-content" variants={container} initial="hidden" animate="show">
          <div className="hero-inner">
            <motion.span className="badge" variants={item}>
              AI-assisted code review
            </motion.span>
            <motion.h1 variants={item}>
              Smarter PR reviews,
              <br />
              on autopilot.
            </motion.h1>
            <BlurText
              text="GitOwl reviews every pull request with AI — flagging bugs, security risks, and scoring overall risk, then posting it as a comment."
              animateBy="words"
              direction="top"
              delay={80}
              stepDuration={0.4}
              className="tagline"
            />
            <motion.p className="tagline-type" variants={item}>
              Add it to any repo in 3 steps.{" "}
              <TextType
                text={["No signup.", "Free to try.", "Open source.", "3 steps setup."]}
                typingSpeed={60}
                pauseDuration={1800}
                deletingSpeed={35}
                showCursor={true}
                cursorCharacter="|"
                cursorClassName="tagline-cursor"
                startOnVisible={false}
              />
            </motion.p>
            <motion.div className="hero-actions" variants={item}>
              <ShimmerButton href={REPO_URL} background="#1e3a8a" shimmerColor="#8ab4ff">
                Add to your repo
              </ShimmerButton>
              <LiquidButton onClick={handleExample} color="#8ab4ff">
                Try the live demo ↓
              </LiquidButton>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <div className="page-content">
        <Reveal>
          <section id="how"><HowItWorks /></section>
        </Reveal>

        <Reveal>
          <section id="screenshot"><Screenshot /></section>
        </Reveal>

        <Reveal>
          <section id="try" className="try">
            <ScrollFloat
              animationDuration={1}
              ease="back.inOut(2)"
              scrollStart="center bottom+=50%"
              scrollEnd="bottom bottom-=40%"
              stagger={0.04}
              textClassName="try-heading"
            >
              Try it live
            </ScrollFloat>
            <p className="try-sub">
              Pick an example or paste a diff — see a real GitOwl review right here. No signup,
              nothing stored.
            </p>
            <DiffInput diff={diff} onChange={setDiff} onSubmit={handleReview} loading={loading} />
            {error && <div className="error-box">{error}</div>}
            {result && <ReviewOutput result={result} />}
          </section>
        </Reveal>

        <Reveal>
          <section id="features"><Features /></section>
        </Reveal>

        <Reveal>
          <section id="setup"><Setup /></section>
        </Reveal>

        <footer>
          Diffs are sent to an AI provider for review and are not stored. Static analysis (Semgrep)
          is skipped in this playground — only the AI review layer runs.{" "}
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            View source on GitHub
          </a>
        </footer>
      </div>
    </ClickSpark>
  );
}

// Fade + rise a section into view once.
function Reveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" as const }}
    >
      {children}
    </motion.div>
  );
}

export default App;
