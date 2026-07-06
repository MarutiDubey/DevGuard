type CursorOptions = {
  size?: number;
  color?: string;
  borderWidth?: number;
  ease?: number;
  hoverScale?: number;
  clickScale?: number;
  zIndex?: number;
  showDefaultCursor?: boolean;
  hoverSelectors?: string[];
};

export function initFloatingCursor(opts: CursorOptions = {}) {
  const options: Required<CursorOptions> = {
    size: opts.size ?? 36,
    color: opts.color ?? "rgba(255,255,255,0.85)",
    borderWidth: opts.borderWidth ?? 1.5,
    ease: Math.min(Math.max(opts.ease ?? 0.18, 0.02), 1),
    hoverScale: opts.hoverScale ?? 1.4,
    clickScale: opts.clickScale ?? 0.85,
    zIndex: opts.zIndex ?? 9999,
    showDefaultCursor: opts.showDefaultCursor ?? false,
    hoverSelectors: opts.hoverSelectors ?? [],
  };

  const el = document.createElement("div");
  el.className = "floating-cursor";
  el.style.setProperty("--fc-size", `${options.size}px`);
  el.style.setProperty("--fc-color", options.color);
  el.style.setProperty("--fc-border", `${options.borderWidth}px`);
  el.style.setProperty("--fc-z", `${options.zIndex}`);
  el.style.setProperty("--fc-hover-scale", `${options.hoverScale}`);
  el.style.setProperty("--fc-click-scale", `${options.clickScale}`);
  el.style.pointerEvents = "none";

  const ring = document.createElement("span");
  ring.className = "fc-ring";
  el.appendChild(ring);

  const dot = document.createElement("span");
  dot.className = "fc-dot";
  el.appendChild(dot);

  document.documentElement.appendChild(el);

  const originalCursor = document.documentElement.style.cursor;
  if (!options.showDefaultCursor) {
    document.documentElement.style.cursor = "none";
  }

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let x = targetX;
  let y = targetY;
  let raf = 0;
  let isHover = false;

  function onMove(e: PointerEvent) {
    targetX = e.clientX;
    targetY = e.clientY;
    el.classList.remove("fc-hidden");
    updateHoverState(e.clientX, e.clientY);
  }

  function updateHoverState(cx: number, cy: number) {
    const node = document.elementFromPoint(cx, cy) as HTMLElement | null;
    const selectors = [
      "a[href]",
      "button",
      "input",
      "textarea",
      "select",
      '[role="button"]',
      "[data-cursor-hover]",
      ...options.hoverSelectors,
    ].join(",");
    const newHover = !!(node?.closest?.(selectors));
    if (newHover !== isHover) {
      isHover = newHover;
      el.classList.toggle("fc-hover", isHover);
    }
  }

  function onDown() {
    el.classList.add("fc-pressed");
  }
  function onUp() {
    el.classList.remove("fc-pressed");
  }
  function onLeave() {
    el.classList.add("fc-hidden");
  }

  function loop() {
    x += (targetX - x) * options.ease;
    y += (targetY - y) * options.ease;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    raf = requestAnimationFrame(loop);
  }

  raf = requestAnimationFrame(loop);
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("pointerup", onUp, { passive: true });
  window.addEventListener("pointerleave", onLeave, { passive: true });
  window.addEventListener("blur", onLeave);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      el.parentElement?.removeChild(el);
      document.documentElement.style.cursor = originalCursor ?? "";
    },
  };
}
