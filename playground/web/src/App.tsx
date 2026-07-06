import { lazy, Suspense, useState, useEffect } from "react";
import { motion } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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
import FuzzyText from "./components/FuzzyText";
import TextType from "./components/TextType";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "./components/ResizableNavbar";
import { ShimmerButton } from "./components/ShimmerButton";
import { LiquidButton } from "./components/LiquidButton";

const REPO_URL = "https://github.com/MarutiDubey/GitOwl";

const NAV_ITEMS = [
  { name: "How it works", link: "#how" },
  { name: "Demo", link: "#try" },
  { name: "Features", link: "#features" },
  { name: "Setup", link: "#setup" },
];


import { IconBrandGithub } from "@tabler/icons-react";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    // Refresh ScrollTrigger after layout stabilizes to catch anchor jumps
    const timeoutId = setTimeout(() => ScrollTrigger.refresh(), 200);
    // Also listen to hash changes for navbar clicks
    const handleHash = () => setTimeout(() => ScrollTrigger.refresh(), 100);
    window.addEventListener("hashchange", handleHash);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("hashchange", handleHash);
    };
  }, []);

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
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={NAV_ITEMS} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <NavbarButton
              href={REPO_URL}
              variant="primary"
              aria-label="GitHub"
              style={{ width: '40px', height: '40px', padding: '0', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <IconBrandGithub size={22} stroke={1.5} />
            </NavbarButton>
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {NAV_ITEMS.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="res-nav-mobile-link"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <NavbarButton
                href={REPO_URL}
                onClick={() => setIsMobileMenuOpen(false)}
                variant="primary"
                aria-label="GitHub"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <IconBrandGithub size={20} stroke={2} />
                  GitHub
                </div>
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

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
            <div className="hero-h1-fuzzy">
              <FuzzyText
                fontSize="clamp(48px, 8vw, 84px)"
                fontWeight={800}
                color="#ffffff"
                baseIntensity={0.15}
                hoverIntensity={0.55}
                enableHover={true}
                fuzzRange={28}
                transitionDuration={8}
              >
                Smarter PR reviews,
              </FuzzyText>
              <FuzzyText
                fontSize="clamp(48px, 8vw, 84px)"
                fontWeight={800}
                color="#ffffff"
                baseIntensity={0.15}
                hoverIntensity={0.55}
                enableHover={true}
                fuzzRange={28}
                transitionDuration={8}
              >
                on autopilot.
              </FuzzyText>
            </div>
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
                text={["No signup.", "Free to try.", "Open source."]}
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
        <section id="how"><HowItWorks /></section>

        <Reveal>
          <section id="screenshot"><Screenshot /></section>
        </Reveal>

        <section id="try" className="try">
          <ScrollFloat
            animationDuration={0.6}
            ease="back.out(1.4)"
            stagger={0.02}
            scrollStart="top 95%"
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
