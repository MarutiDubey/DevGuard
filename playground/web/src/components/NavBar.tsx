import { useState } from "react";
import "./NavBar.css";

export type NavItem = { label: string; href: string };

interface NavBarProps {
  items: NavItem[];
  initialActiveIndex?: number;
}

/**
 * Simple, reliable pill navbar. Active item gets a navy pill with white text;
 * hover highlights. No overlays / blend-modes (which made the old GooeyNav
 * render doubled or invisible text).
 */
export function NavBar({ items, initialActiveIndex = 0 }: NavBarProps) {
  const [active, setActive] = useState(initialActiveIndex);

  return (
    <nav className="nav-pills" aria-label="Primary">
      {items.map((item, i) => (
        <a
          key={item.href}
          href={item.href}
          className={`nav-pill ${active === i ? "active" : ""}`}
          onClick={() => setActive(i)}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
