import { WindIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { wellingtonCopy } from "../data/memorialContent";
import { Reveal } from "./Reveal";

/**
 * The Wellington twist: her one New Zealand show missed this city, so the
 * wind stands in for her.
 *
 * @returns The Wellington section
 */
export function WellingtonSection(): ReactNode {
  return (
    <section id="wellington" className="border-y border-gold/25 bg-ink-2">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-24 lg:grid-cols-[3fr_2fr]">
        <Reveal>
          <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-gold">
            {wellingtonCopy.eyebrow}
          </p>
          <h2 className="font-display text-5xl leading-[0.95] font-semibold tracking-tight md:text-6xl">
            {wellingtonCopy.title}
          </h2>
          {wellingtonCopy.body.map((paragraph) => (
            <p
              key={paragraph}
              className="mt-6 max-w-[52ch] leading-relaxed text-moss"
            >
              {paragraph}
            </p>
          ))}
        </Reveal>
        <Reveal className="relative">
          <div className="border border-gold/30 bg-ink-3 p-8">
            <WindIcon size={28} className="text-gold" aria-hidden="true" />
            <p className="mt-4 font-display text-2xl leading-snug italic text-cream">
              &ldquo;She never sang in Wellington. So we sing for her.&rdquo;
            </p>
            <p className="mt-4 text-sm text-moss">A note from this memorial</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
