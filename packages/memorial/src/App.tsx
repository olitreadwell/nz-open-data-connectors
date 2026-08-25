import type { ReactNode } from "react";
import { BooksSection } from "./components/BooksSection";
import { FooterSection } from "./components/FooterSection";
import { GallerySection } from "./components/GallerySection";
import { Hero } from "./components/Hero";
import { Nav } from "./components/Nav";
import { SongMarquee } from "./components/SongMarquee";
import { Timeline } from "./components/Timeline";
import { TributeCards } from "./components/TributeCards";
import { WellingtonSection } from "./components/WellingtonSection";

/**
 * The Dolly Parton Wellington memorial page.
 *
 * @returns The full memorial page
 */
export function App(): ReactNode {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <SongMarquee />
        <Timeline />
        <WellingtonSection />
        <TributeCards />
        <BooksSection />
        <GallerySection />
      </main>
      <FooterSection />
    </div>
  );
}
