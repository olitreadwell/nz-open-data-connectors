import { ArrowDownIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { heroCopy } from "../data/memorialContent";

/**
 * Hero section: split layout with portrait, headline and a single CTA.
 *
 * @returns The hero section
 */
export function Hero(): ReactNode {
  return (
    <section
      id="top"
      className="grid min-h-[100dvh] grid-cols-1 lg:grid-cols-2"
    >
      <div className="flex flex-col justify-center px-5 py-16 lg:px-16 lg:py-0">
        <p className="animate-rise mb-6 text-[11px] uppercase tracking-[0.22em] text-gold">
          {heroCopy.eyebrow}
        </p>
        <h1 className="animate-rise font-display text-6xl leading-[0.95] font-semibold tracking-tight md:text-7xl">
          The wind keeps <em className="text-gold-soft">her songs.</em>
        </h1>
        <p className="animate-rise mt-6 max-w-[42ch] text-lg leading-relaxed text-moss">
          {heroCopy.subtitle}
        </p>
        <a
          href={heroCopy.ctaHref}
          className="animate-rise mt-10 inline-flex w-fit items-center gap-2 bg-gold px-6 py-3 text-sm font-semibold tracking-wide text-ink transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft active:translate-y-0"
        >
          {heroCopy.cta}
          <ArrowDownIcon size={16} weight="bold" />
        </a>
      </div>
      <div className="relative min-h-[50vh] lg:min-h-0">
        <img
          src="images/dolly-1977.jpg"
          alt="Portrait of Dolly Parton"
          className="h-full w-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent lg:bg-gradient-to-r lg:from-ink lg:via-ink/30 lg:to-transparent" />
      </div>
    </section>
  );
}
