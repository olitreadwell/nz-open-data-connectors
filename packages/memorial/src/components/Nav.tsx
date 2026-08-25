import type { ReactNode } from "react";

const navItems = [
  "Story",
  "Wellington",
  "Tributes",
  "Books",
  "Gallery",
] as const;

/**
 * Single-line sticky navigation for the memorial page.
 *
 * @returns The page navigation bar
 */
export function Nav(): ReactNode {
  return (
    <nav
      aria-label="Page sections"
      className="sticky top-0 z-20 border-b border-gold/25 bg-ink/85 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <a
          href="#top"
          className="font-display text-lg font-semibold tracking-wide"
        >
          Dolly <span className="italic text-gold">Parton</span>
        </a>
        <ul className="flex items-center gap-5 text-sm">
          {navItems.map((label) => (
            <li key={label}>
              <a
                href={`#${label.toLowerCase()}`}
                className="text-moss transition-colors hover:text-gold focus-visible:text-gold"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
