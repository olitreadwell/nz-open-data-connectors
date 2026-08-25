import type { ReactNode } from "react";
import { galleryImages } from "../data/memorialContent";
import { Reveal } from "./Reveal";

/**
 * Photo gallery with captions and license credits for every image.
 *
 * @returns The gallery section
 */
export function GallerySection(): ReactNode {
  return (
    <section id="gallery" className="mx-auto max-w-6xl px-6 py-24">
      <Reveal>
        <h2 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
          Still <em className="text-gold-soft">shining</em>
        </h2>
      </Reveal>
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {galleryImages.map((image, index) => (
          <Reveal key={image.src} className={index % 2 === 1 ? "lg:mt-12" : ""}>
            <figure>
              <div className="overflow-hidden border border-gold/25">
                <img
                  src={image.src}
                  alt={image.alt}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              <figcaption className="mt-3">
                <p className="text-sm font-semibold text-cream">
                  {image.caption}
                </p>
                <p className="mt-1 text-xs text-moss">
                  {image.credit}, {image.license}
                  <span className="mx-1">·</span>
                  <a
                    href={image.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:text-gold"
                  >
                    Source
                  </a>
                </p>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
