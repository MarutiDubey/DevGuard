import React, { useRef, useState } from "react";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import "./ResizableNavbar.css";

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface NavItemsProps {
  items: {
    name: string;
    link: string;
  }[];
  className?: string;
  onItemClick?: () => void;
}

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Navbar = ({ children, className = "" }: NavbarProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState<boolean>(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  return (
    <motion.div ref={ref} className={`res-nav-wrapper ${className}`}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<{ visible?: boolean }>, { visible })
          : child
      )}
    </motion.div>
  );
};

export const NavBody = ({ children, className = "", visible }: NavBodyProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(10px)" : "none",
        boxShadow: visible
          ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04)"
          : "none",
        width: visible ? "40%" : "100%",
        y: visible ? 20 : 0,
      }}
      transition={{ type: "spring", stiffness: 200, damping: 50 }}
      style={{ minWidth: "700px" }}
      className={`res-nav-body ${visible ? "visible" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
};

export const NavItems = ({ items, className = "", onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className={`res-nav-items ${className}`} onMouseLeave={() => setHovered(null)}>
      {items.map((item, idx) => (
        <a
          key={`link-${idx}`}
          href={item.link}
          className="res-nav-item"
          onMouseEnter={() => setHovered(idx)}
          onClick={onItemClick}
        >
          {hovered === idx && (
            <motion.div layoutId="nav-hovered" className="res-nav-item-hover-bg" />
          )}
          <span className="res-nav-item-text">{item.name}</span>
        </a>
      ))}
    </div>
  );
};

export const MobileNav = ({ children, className = "", visible }: MobileNavProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(10px)" : "none",
        boxShadow: visible
          ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05)"
          : "none",
        width: visible ? "90%" : "100%",
        paddingRight: visible ? "12px" : "0px",
        paddingLeft: visible ? "12px" : "0px",
        borderRadius: visible ? "8px" : "32px",
        y: visible ? 20 : 0,
      }}
      transition={{ type: "spring", stiffness: 200, damping: 50 }}
      className={`res-nav-mobile ${visible ? "visible" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
};

export const MobileNavHeader = ({ children, className = "" }: MobileNavHeaderProps) => {
  return <div className={`res-nav-mobile-header ${className}`}>{children}</div>;
};

export const MobileNavMenu = ({ children, className = "", isOpen, onClose }: MobileNavMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`res-nav-mobile-menu ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MobileNavToggle = ({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) => {
  return isOpen ? (
    <IconX style={{ cursor: "pointer", color: "var(--text-h)" }} onClick={onClick} />
  ) : (
    <IconMenu2 style={{ cursor: "pointer", color: "var(--text-h)" }} onClick={onClick} />
  );
};

export const NavbarLogo = () => {
  return (
    <a href="/" className="res-nav-logo">
      <div className="owl-icon" aria-hidden="true" style={{ width: 32, height: 32 }}>
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
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
      <span className="res-nav-logo-text">GitOwl</span>
    </a>
  );
};

export const NavbarButton = ({
  href,
  as: Tag = "a",
  children,
  className = "",
  variant = "primary",
  ...props
}: {
  href?: string;
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
} & (React.ComponentPropsWithoutRef<"a"> | React.ComponentPropsWithoutRef<"button">)) => {
  return (
    <Tag
      href={href || undefined}
      className={`res-nav-btn res-nav-btn-${variant} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
};
