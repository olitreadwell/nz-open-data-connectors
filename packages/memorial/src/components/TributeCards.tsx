import { ArrowUpRightIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { tributeCards } from "../data/memorialContent";
import { Reveal } from "./Reveal";

/**
 * New Zealand media tributes to Dolly Parton.
 *
 * @returns The tributes section
 */
export function TributeCards(): ReactNode {
  return (
    <section id="tributes" className="mx-auto max-w-6xl px-6 py-24">
      <Reveal>
        <h2 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
          Aotearoa said <em className="text-gold-soft">goodbye</em>
        </h2>
      </Reveal>
      <div className="mt-12 grid grid-cols-1 gap-px bg-gold/20 md:grid-cols-3">
        {tributeCards.map((card) => (
          <Reveal key={card.headline} className="bg-ink">
            <article className="flex h-full flex-col border border-gold/20 bg-ink-2 p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-gold">
                {card.outlet}
              </p>
              <h3 className="mt-3 text-lg leading-snug font-semibold text-cream">
                {card.headline}
              </h3>
              <blockquote className="mt-4 flex-1">
                <p className="font-display text-xl leading-snug text-gold-soft italic">
                  &ldquo;{card.quote}&rdquo;
                </p>
              </blockquote>
              <a
                href={card.url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-gold underline-offset-4 hover:underline focus-visible:underline"
              >
                Read it
                <ArrowUpRightIcon size={14} weight="bold" aria-hidden="true" />
              </a>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
