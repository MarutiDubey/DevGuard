import type { CSSProperties, ReactNode } from "react";
import "./LiquidButton.css";

interface LiquidButtonProps {
  children: ReactNode;
  onClick?: () => void;
  color?: string;
  background?: string;
  className?: string;
}

/**
 * A button that fills from the bottom on hover.
 * Adapted (plain CSS) from animate-ui's liquid button.
 */
export function LiquidButton({
  children,
  onClick,
  color = "#1e3a8a",
  background = "transparent",
  className = "",
}: LiquidButtonProps) {
  const style = {
    "--liquid-color": color,
    "--liquid-bg": background,
  } as CSSProperties;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`liquid-button ${className}`}
      style={style}
    >
      <span className="liquid-fill" aria-hidden="true" />
      <span className="liquid-label">{children}</span>
    </button>
  );
}
