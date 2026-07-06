import { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./ScrollFloat.css";

gsap.registerPlugin(ScrollTrigger);

type ScrollFloatProps = {
  children: React.ReactNode;
  scrollContainerRef?: React.RefObject<HTMLElement>;
  containerClassName?: string;
  textClassName?: string;
  animationDuration?: number;
  ease?: string;
  scrollStart?: string;
  stagger?: number;
};

export default function ScrollFloat({
  children,
  scrollContainerRef,
  containerClassName = "",
  textClassName = "",
  animationDuration = 0.8,
  ease = "back.out(1.4)",
  scrollStart = "top 85%",
  stagger = 0.03,
}: ScrollFloatProps) {
  const containerRef = useRef<HTMLHeadingElement>(null);

  const splitText = useMemo(() => {
    const text = (typeof children === "string" ? children : "").trim();
    return text.split("").map((char, index) => (
      <span className="char" key={index}>
        {char === " " ? "\u00A0" : char}
      </span>
    ));
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scroller =
      scrollContainerRef?.current ? scrollContainerRef.current : window;

    const charElements = el.querySelectorAll(".char");

    // Flash rokne ke liye initially invisible rakha hai
    gsap.set(charElements, { opacity: 0, yPercent: 60, scaleY: 1.4, scaleX: 0.85, transformOrigin: "50% 0%" });

    const ctx = gsap.context(() => {
      gsap.to(charElements, {
        duration: animationDuration,
        ease,
        opacity: 1,
        yPercent: 0,
        scaleY: 1,
        scaleX: 1,
        stagger,
        scrollTrigger: {
          trigger: el,
          scroller,
          start: scrollStart,
          // Ek baar trigger hoke visible rahega (no scrub)
          toggleActions: "play none none none",
          once: true,
        },
      });
    }, el);

    // Fonts aur images load hone ke baad ScrollTrigger wapas refresh kiya hai taaki positions sahi rahein
    const timeoutId = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      ctx.revert();
    };
  }, [scrollContainerRef, animationDuration, ease, scrollStart, stagger]);

  return (
    <h2 ref={containerRef} className={`scroll-float ${containerClassName}`}>
      <span className={`scroll-float-text ${textClassName}`}>{splitText}</span>
    </h2>
  );
}
