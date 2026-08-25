import type { ReactNode } from "react";
import { marqueeSongs } from "../data/memorialContent";

/**
 * Song-title marquee, the wind motif of the page.
 *
 * @returns The marquee band
 */
export function SongMarquee(): ReactNode {
  const lane = marqueeSongs.join("   ·   ");
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden border-y border-gold/25 bg-ink-2 py-3"
    >
      <div className="wind-marquee flex w-max whitespace-nowrap font-display text-xl tracking-wide text-gold/70 italic">
        <span className="pr-8">{lane}</span>
        <span className="pr-8">{lane}</span>
      </div>
    </div>
  );
}
