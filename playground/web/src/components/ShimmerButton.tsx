import type { CSSProperties, ReactNode } from "react";
import "./ShimmerButton.css";

interface ShimmerButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  shimmerColor?: string;
  background?: string;
  className?: string;
}

/**
 * A button with a shimmering light that travels around the perimeter.
 * Adapted (plain CSS, no Tailwind) from magicui's shimmer-button.
 */
export function ShimmerButton({
  children,
  href,
  onClick,
  shimmerColor = "#ffffff",
  background = "#1e3a8a",
  className = "",
}: ShimmerButtonProps) {
  const style = {
    "--shimmer-color": shimmerColor,
    "--shimmer-bg": background,
  } as CSSProperties;

  const inner = (
    <>
      <span className="shimmer-spark" aria-hidden="true">
        <span className="shimmer-spark-inner" />
      </span>
      <span className="shimmer-label">{children}</span>
      <span className="shimmer-backdrop" aria-hidden="true" />
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`shimmer-button ${className}`}
        style={style}
      >
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={`shimmer-button ${className}`} style={style}>
      {inner}
    </button>
  );
}
