import type { ReactNode } from "react";
import { useReveal } from "../hooks/useReveal";

interface RevealProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper that fades a block in as it scrolls into view.
 *
 * @param props - Component props
 * @param props.children - Content to reveal
 * @param props.className - Extra classes on the wrapper
 * @returns A scroll-revealed section
 */
export function Reveal({ children, className = "" }: RevealProps): ReactNode {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "reveal-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
