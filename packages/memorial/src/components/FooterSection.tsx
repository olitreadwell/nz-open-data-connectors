import { HeartIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { sourceLinks } from "../data/memorialContent";

/**
 * Footer with sources and image credits.
 *
 * @returns The footer
 */
export function FooterSection(): ReactNode {
  return (
    <footer className="border-t border-gold/25 bg-ink-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl font-semibold">
            Dolly <em className="text-gold-soft">Parton</em>
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm text-moss">
            Made in Wellington, carried by the wind.
            <HeartIcon
              size={14}
              weight="fill"
              className="text-gold"
              aria-hidden="true"
            />
          </p>
          <p className="mt-6 text-sm text-moss">
            An unofficial fan memorial. Not affiliated with the Dolly Parton
            estate or the Dollywood Foundation.
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold">
            Sources
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {sourceLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-moss underline-offset-4 hover:text-gold hover:underline"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold">
            Image credits
          </p>
          <p className="mt-3 text-sm text-moss">
            Photographs are used under their Wikimedia Commons licenses,
            credited inline in the gallery. Full source links sit next to each
            image.
          </p>
        </div>
      </div>
    </footer>
  );
}
