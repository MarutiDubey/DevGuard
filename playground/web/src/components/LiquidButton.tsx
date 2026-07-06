import type { CSSProperties, ReactNode } from "react";
import "./LiquidButton.css";

interface LiquidButtonProps {
  children: ReactNode;
  onClick?: () => void;
  color?: string;
  background?: string;
  fillColor?: string;
  hoverText?: string;
  className?: string;
}

/**
 * A button that fills from the bottom on hover.
 * Adapted (plain CSS) from animate-ui's liquid button.
 */
export function LiquidButton({
  children,
  onClick,
  color = "#8ab4ff",
  background = "transparent",
  fillColor = "#ffffff",
  hoverText = "#0f172a",
  className = "",
}: LiquidButtonProps) {
  const style = {
    "--liquid-color": color,
    "--liquid-bg": background,
    "--liquid-fill-color": fillColor,
    "--liquid-hover-text": hoverText,
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
