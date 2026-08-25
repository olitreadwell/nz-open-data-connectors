import { BookOpenIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { booksCopy } from "../data/memorialContent";
import { Reveal } from "./Reveal";

/**
 * Full-width band about the Imagination Library and Wellington libraries.
 *
 * @returns The books section
 */
export function BooksSection(): ReactNode {
  return (
    <section id="books" className="border-y border-gold/25 bg-ink-2">
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <Reveal>
          <BookOpenIcon
            size={32}
            className="mx-auto text-gold"
            aria-hidden="true"
          />
          <h2 className="mt-6 font-display text-5xl font-semibold tracking-tight md:text-6xl">
            {booksCopy.title}
          </h2>
          {booksCopy.body.map((paragraph) => (
            <p
              key={paragraph}
              className="mx-auto mt-5 max-w-[48ch] leading-relaxed text-moss"
            >
              {paragraph}
            </p>
          ))}
          <a
            href={booksCopy.ctaHref}
            target="_blank"
            rel="noreferrer"
            className="mt-9 inline-flex items-center gap-2 bg-gold px-6 py-3 text-sm font-semibold tracking-wide text-ink transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft active:translate-y-0"
          >
            {booksCopy.cta}
          </a>
        </Reveal>
      </div>
    </section>
  );
}
