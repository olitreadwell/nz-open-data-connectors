import type { ReactNode } from "react";
import { timelineEntries } from "../data/memorialContent";
import { Reveal } from "./Reveal";

/**
 * Vertical timeline of Dolly Parton's life, sourced to RNZ, the NZ Herald
 * archive and the Blue Smoke World Tour record.
 *
 * @returns The story timeline section
 */
export function Timeline(): ReactNode {
  return (
    <section id="story" className="mx-auto max-w-3xl px-6 py-24">
      <Reveal>
        <h2 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
          Her <em className="text-gold-soft">story</em>
        </h2>
      </Reveal>
      <ol className="mt-14 border-l border-gold/30">
        {timelineEntries.map((entry, index) => (
          <li
            key={entry.year + entry.title}
            className="relative pb-12 pl-10 last:pb-0"
          >
            <span className="absolute top-1 left-[-5px] h-2.5 w-2.5 rounded-full bg-gold" />
            <Reveal>
              <p className="font-display text-2xl italic text-gold">
                {entry.year}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-cream">
                {entry.title}
              </h3>
              <p className="mt-2 max-w-[58ch] leading-relaxed text-moss">
                {entry.body}
              </p>
              {index === timelineEntries.length - 1 ? null : (
                <span className="sr-only">Next</span>
              )}
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
