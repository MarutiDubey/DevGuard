import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "motion/react";

export function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Ring cursor me thoda lag spring effect diya hai
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  // Dot ke liye snappy spring rakhi hai
  const dotSpringConfig = { damping: 25, stiffness: 600, mass: 0.1 };
  const dotXSpring = useSpring(cursorX, dotSpringConfig);
  const dotYSpring = useSpring(cursorY, dotSpringConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    const onEnter = () => setIsVisible(true);
    const onLeave = () => setIsVisible(false);

    setIsVisible(true);
    window.addEventListener("mousemove", moveCursor);
    document.body.addEventListener("mouseenter", onEnter);
    document.body.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.body.removeEventListener("mouseenter", onEnter);
      document.body.removeEventListener("mouseleave", onLeave);
    };
  }, [cursorX, cursorY]);

  useEffect(() => {
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const isInteractive =
        t.tagName === "BUTTON" ||
        t.tagName === "A" ||
        t.closest("button") ||
        t.closest("a") ||
        t.classList.contains("cursor-hover-target");
      setIsHovering(!!isInteractive);
    };
    window.addEventListener("mouseover", onOver);
    return () => window.removeEventListener("mouseover", onOver);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Trailing ring */}
          <motion.div
            className="custom-cursor-ring"
            style={{
              x: cursorXSpring,
              y: cursorYSpring,
              translateX: "-50%",
              translateY: "-50%",
            }}
            animate={{
              scale: isHovering ? 1.5 : 1,
              backgroundColor: isHovering ? "rgba(255,255,255,1)" : "rgba(255,255,255,0)",
              borderColor: isHovering ? "transparent" : "rgba(255,255,255,0.5)",
            }}
            transition={{ duration: 0.2 }}
          />
          {/* Precise center dot */}
          <motion.div
            className="custom-cursor-dot"
            style={{
              x: dotXSpring,
              y: dotYSpring,
              translateX: "-50%",
              translateY: "-50%",
            }}
            animate={{ opacity: isHovering ? 0 : 1 }}
          />
        </>
      )}
    </AnimatePresence>
  );
}
